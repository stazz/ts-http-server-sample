import * as core from "../../core/core";
import * as t from "runtypes";
import * as validate from "./validate";
import type * as error from "./error";
import * as utils from "./utils";
import type * as q from "querystring";

export const urlParameter = <T extends validate.Decoder<unknown>>(
  validation: StringParameterTransform<T>,
  regExp?: RegExp,
): core.URLDataParameterValidatorSpec<t.Static<T>, error.ValidationError> => ({
  regExp: regExp ?? core.defaultParameterRegExp(),
  validator: createValidatorForStringParameter(validation),
});

export const queryValidator = <
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: StringParameterTransform<t.Runtype>;
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
  { [P in TRequired]: t.Static<TValidation[P]["validation"]> } & {
    [P in TOptional]?: t.Static<TValidation[P]["validation"]>;
  },
  error.ValidationError
> => {
  // Unfortunately, Runtypes does not have "exact", and the following PR is still open:
  // https://github.com/pelotom/runtypes/pull/162
  const initialValidator = validate.plainValidator(
    t.Intersect(
      t.Record(Object.fromEntries(required.map((r) => [r, t.String]))),
      t.Record(
        Object.fromEntries(optional.map((o) => [o, t.String.optional()])),
      ),
    ),
  );
  const paramValidators = Object.fromEntries(
    Object.entries(
      validation as Record<string, StringParameterTransform<t.Runtype>>,
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
        { [P in TRequired]: t.Static<TValidation[P]["validation"]> } & {
          [P in TOptional]?: t.Static<TValidation[P]["validation"]>;
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

export interface StringParameterTransform<
  TValidation extends t.Runtype,
  // TStringValidation extends Decoder<string> & t.Mixed = t.StringType,
> {
  transform: (value: string) => t.Static<TValidation>;
  validation: TValidation;
  stringValidation?: validate.Decoder<string>;
}

export interface QueryValidatorPropertySpec<
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: StringParameterTransform<t.Runtype>;
  },
> {
  required: ReadonlyArray<TRequired>;
  optional: ReadonlyArray<TOptional>;
  validation: TValidation;
}

const createValidatorForStringParameter =
  <TValidation extends t.Runtype>({
    transform,
    validation,
    stringValidation,
  }: StringParameterTransform<TValidation>): core.DataValidator<
    string,
    t.Static<TValidation>,
    error.ValidationError
  > =>
  (str) => {
    try {
      if (stringValidation) {
        const stringValidationResult =
          utils.transformLibraryResultToModelResult(
            stringValidation.validate(str),
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
        validation.validate(transform(str)),
      );
    } catch (e) {
      return {
        error: "error",
        errorInfo: utils.exceptionAsValidationError(str, e),
      };
    }
  };
