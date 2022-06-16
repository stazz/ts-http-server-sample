import * as core from "../../core/core";
import * as t from "zod";
import * as validate from "./validate";
import type * as error from "./error";
import * as utils from "./utils";
import type * as q from "querystring";

export const urlParameter = <T extends validate.Decoder<unknown>>(
  validation: StringParameterTransform<T, string>,
  regExp?: RegExp,
): core.URLDataParameterValidatorSpec<t.infer<T>, error.ValidationError> => ({
  regExp: regExp ?? core.defaultParameterRegExp(),
  validator: createValidatorForStringParameter(validation, true),
});

export const queryValidator = <
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired]: StringParameterTransform<t.ZodType, string>;
  } & {
    [P in TOptional]: StringParameterTransform<t.ZodType, string | undefined>;
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
  { [P in TRequired]: t.infer<TValidation[P]["validation"]> } & {
    [P in TOptional]?: t.infer<TValidation[P]["validation"]>;
  },
  error.ValidationError
> => {
  // Unfortunately, Runtypes does not have "exact", and the following PR is still open:
  // https://github.com/pelotom/runtypes/pull/162
  const initialValidator = validate.plainValidator(
    t.object({
      ...Object.fromEntries(required.map((r) => [r, t.string()])),
      ...Object.fromEntries(optional.map((o) => [o, t.string().optional()])),
    }),
  );
  const paramValidators = Object.fromEntries(
    Object.entries(
      validation as Record<
        string,
        StringParameterTransform<t.ZodType, string | undefined>
      >,
    ).map(([key, paramValidation]) => [
      key,
      createValidatorForStringParameter(
        paramValidation,
        required.indexOf(key as TRequired) >= 0,
      ),
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
        { [P in TRequired]: t.infer<TValidation[P]["validation"]> } & {
          [P in TOptional]?: t.infer<TValidation[P]["validation"]>;
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
  TValidation extends t.ZodType,
  TStringValidation extends validate.Decoder<string>,
>(
  stringValidation: TStringValidation,
  validation: TValidation,
  transform: (val: t.infer<TStringValidation>) => t.infer<TValidation>,
): StringParameterTransform<TValidation, string | undefined> =>
  ({
    stringValidation,
    validation,
    transform,
  } as StringParameterTransform<TValidation, string | undefined>);

export interface StringParameterTransform<
  TValidation extends t.ZodType,
  TString,
  // TStringValidation extends Decoder<string> & t.Mixed = t.StringType,
> {
  // Notice that transform will receive value which passed stringValidation, if stringValidation is supplied
  transform: (value: TString) => t.infer<TValidation>;
  validation: TValidation;
  stringValidation?: validate.Decoder<string>;
}

export interface QueryValidatorPropertySpec<
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: StringParameterTransform<
      t.ZodType,
      string | undefined
    >;
  },
> {
  required: ReadonlyArray<TRequired>;
  optional: ReadonlyArray<TOptional>;
  validation: TValidation;
}

function createValidatorForStringParameter<TValidation extends t.ZodType>(
  {
    transform,
    validation,
    stringValidation,
  }: StringParameterTransform<TValidation, string>,
  isRequired: true,
): core.DataValidator<string, t.infer<TValidation>, error.ValidationError>;
function createValidatorForStringParameter<TValidation extends t.ZodType>(
  {
    transform,
    validation,
    stringValidation,
  }: StringParameterTransform<TValidation, string | undefined>,
  isRequired: false,
): core.DataValidator<
  string | undefined,
  t.infer<TValidation>,
  error.ValidationError
>;
function createValidatorForStringParameter<TValidation extends t.ZodType>(
  {
    transform,
    validation,
    stringValidation,
  }: StringParameterTransform<TValidation, string | undefined>,
  isRequired: boolean,
): core.DataValidator<
  string | undefined,
  t.infer<TValidation>,
  error.ValidationError
>;
function createValidatorForStringParameter<TValidation extends t.ZodType>(
  {
    transform,
    validation,
    stringValidation,
  }:
    | StringParameterTransform<TValidation, string | undefined>
    | StringParameterTransform<TValidation, string>,
  isRequired: boolean,
): core.DataValidator<
  string | undefined,
  t.infer<TValidation>,
  error.ValidationError
> {
  return (str: string | undefined) => {
    try {
      if (str === undefined && isRequired) {
        return {
          error: "error",
          errorInfo: utils.exceptionAsValidationError(
            str,
            new Error("String parameter is required, but no value provided"),
          ),
        };
      }
      if (stringValidation) {
        const stringValidationResult =
          utils.transformLibraryResultToModelResult(
            stringValidation.safeParse(str),
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        validation.safeParse(transform(str!)),
      );
    } catch (e) {
      return {
        error: "error",
        errorInfo: utils.exceptionAsValidationError(str, e),
      };
    }
  };
}
