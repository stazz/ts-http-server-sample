import * as data from "../../core/data-server";
import * as t from "zod";
import * as common from "../../data/zod";
import type * as q from "querystring";

export const urlParameter = <T extends common.Decoder<unknown>>(
  validation: StringParameterTransform<T, string>,
  regExp?: RegExp,
): data.URLDataParameterValidatorSpec<t.infer<T>, common.ValidationError> => ({
  regExp: regExp ?? data.defaultParameterRegExp(),
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
>): data.QueryValidatorSpec<
  { [P in TRequired]: t.infer<TValidation[P]["validation"]> } & {
    [P in TOptional]?: t.infer<TValidation[P]["validation"]>;
  },
  TRequired | TOptional,
  common.ValidationError
> => {
  // Unfortunately, Runtypes does not have "exact", and the following PR is still open:
  // https://github.com/pelotom/runtypes/pull/162
  const initialValidator = common.plainValidator(
    t.strictObject({
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
  const finalValidator = data.transitiveDataValidation(
    initialValidator,
    (data) => {
      const finalResult: Record<string, unknown> = {};
      const errors: common.ValidationError = [];
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
      validator: finalValidator as data.DataValidator<
        q.ParsedUrlQuery,
        { [P in TRequired]: t.infer<TValidation[P]["validation"]> } & {
          [P in TOptional]?: t.infer<TValidation[P]["validation"]>;
        },
        common.ValidationError
      >,
    },
    isParameterRequired: Object.fromEntries(
      required
        .map<[string, boolean]>((r) => [r, true])
        .concat(optional.map((o) => [o, false])),
    ) as Record<TRequired | TOptional, boolean>,
  };
};

export const stringParameterWithTransform = <
  TValidation extends t.ZodType,
  TStringValidation extends common.Decoder<string | undefined>,
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
  stringValidation?: common.Decoder<TString>;
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
): data.DataValidator<string, t.infer<TValidation>, common.ValidationError>;
function createValidatorForStringParameter<TValidation extends t.ZodType>(
  {
    transform,
    validation,
    stringValidation,
  }: StringParameterTransform<TValidation, string | undefined>,
  isRequired: false,
): data.DataValidator<
  string | undefined,
  t.infer<TValidation>,
  common.ValidationError
>;
function createValidatorForStringParameter<TValidation extends t.ZodType>(
  {
    transform,
    validation,
    stringValidation,
  }: StringParameterTransform<TValidation, string | undefined>,
  isRequired: boolean,
): data.DataValidator<
  string | undefined,
  t.infer<TValidation>,
  common.ValidationError
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
): data.DataValidator<
  string | undefined,
  t.infer<TValidation>,
  common.ValidationError
> {
  return (str: string | undefined) => {
    try {
      if (str === undefined && isRequired) {
        return {
          error: "error",
          errorInfo: common.exceptionAsValidationError(
            str,
            new Error("String parameter is required, but no value provided"),
          ),
        };
      }
      if (stringValidation) {
        const stringValidationResult =
          common.transformLibraryResultToModelResult(
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
      return common.transformLibraryResultToModelResult(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        validation.safeParse(transform(str!)),
      );
    } catch (e) {
      return {
        error: "error",
        errorInfo: common.exceptionAsValidationError(str, e),
      };
    }
  };
}
