import * as core from "../../core/core";
import * as t from "io-ts";
import * as validate from "./validate";
import type * as error from "./error";
import * as utils from "./utils";
import type * as q from "querystring";

export const urlParameter = <T extends validate.Decoder<unknown> & t.Mixed>(
  validation: StringParameterTransform<T>,
  regExp?: RegExp,
): core.URLDataParameterValidatorSpec<t.TypeOf<T>, error.ValidationError> => ({
  regExp: regExp ?? core.defaultParameterRegExp(),
  validator: createValidatorForStringParameter(validation),
});

// TODO test whether t.partial({a: t.string}) will validate on object { a: undefined }.
// That will decide how to proceed in regards to string | undefined validation as is in runtypes and zod libs.
export const queryValidator = <
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: StringParameterTransform<t.Mixed>;
  },
>({
  required,
  optional,
  validation,
}: QueryValidatorPropertySpec<
  TRequired,
  TOptional,
  TValidation
>): core.QueryValidatorSpec<
  { [P in TRequired]: t.TypeOf<TValidation[P]["validation"]> } & {
    [P in TOptional]?: t.TypeOf<TValidation[P]["validation"]>;
  },
  error.ValidationError
> => {
  const initialValidator = validate.plainValidator(
    t.exact(
      t.intersection([
        t.type(Object.fromEntries(required.map((r) => [r, t.string]))),
        t.partial(Object.fromEntries(optional.map((o) => [o, t.string]))),
      ]),
    ),
  );
  const paramValidators = Object.fromEntries(
    Object.entries(
      validation as Record<string, StringParameterTransform<t.Mixed>>,
    ).map(([key, paramValidation]) => [
      key,
      createValidatorForStringParameter(paramValidation),
    ]),
  );
  const finalValidator = core.transitiveDataValidation(
    initialValidator,
    (data) => {
      const finalResult: Record<string, unknown> = {};
      const errors: error.ValidationError = [];
      for (const [key, dataItemIter] of Object.entries(data)) {
        const paramValidationResult = paramValidators[key](dataItemIter);
        switch (paramValidationResult.error) {
          case "none":
            finalResult[key] = paramValidationResult.data;
            break;
          default:
            errors.push(...paramValidationResult.errorInfo);
        }
      }
      return errors.length > 0
        ? {
            error: "error",
            errorInfo: errors,
          }
        : {
            error: "none",
            data: finalResult,
          };
    },
  );
  return {
    validator: {
      query: "object",
      validator: finalValidator as core.DataValidator<
        q.ParsedUrlQuery,
        { [P in TRequired]: t.TypeOf<TValidation[P]["validation"]> } & {
          [P in TOptional]?: t.TypeOf<TValidation[P]["validation"]>;
        },
        error.ValidationError
      >,
    },
    isParameterRequired: Object.fromEntries(
      required
        .map<[string, boolean]>((r) => [r, true])
        .concat(optional.map((o) => [o, false])),
    ),
  };
};

export const stringParameterWithTransform = <
  TValidation extends t.Mixed,
  TStringValidation extends validate.Decoder<string> & t.Mixed,
>(
  stringValidation: TStringValidation,
  validation: TValidation,
  transform: (val: t.TypeOf<TStringValidation>) => t.TypeOf<TValidation>,
): StringParameterTransform<TValidation> =>
  ({
    stringValidation,
    validation,
    transform,
  } as StringParameterTransform<TValidation>);

export interface StringParameterTransform<
  TValidation extends t.Mixed,
  // TStringValidation extends Decoder<string> & t.Mixed = t.StringType,
> {
  transform: (value: string) => t.TypeOf<TValidation>;
  validation: TValidation;
  stringValidation?: validate.Decoder<string>;
}

export interface QueryValidatorPropertySpec<
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: StringParameterTransform<t.Mixed>;
  },
> {
  required: ReadonlyArray<TRequired>;
  optional: ReadonlyArray<TOptional>;
  validation: TValidation;
}

const createValidatorForStringParameter =
  <TValidation extends t.Mixed>({
    transform,
    validation,
    stringValidation,
  }: StringParameterTransform<TValidation>): core.DataValidator<
    string,
    t.TypeOf<TValidation>,
    error.ValidationError
  > =>
  (str) => {
    try {
      if (stringValidation) {
        const stringValidationResult =
          utils.transformLibraryResultToModelResult(
            stringValidation.decode(str),
          );
        switch (stringValidationResult.error) {
          case "none":
            str = stringValidationResult.data;
            break;
          default:
            return stringValidationResult;
        }
      }
      return utils.transformLibraryResultToModelResult(
        validation.decode(transform(str)),
      );
    } catch (e) {
      return {
        error: "error",
        errorInfo: utils.exceptionAsValidationError(str, e),
      };
    }
  };
