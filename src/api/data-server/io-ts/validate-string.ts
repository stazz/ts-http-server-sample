import * as data from "../../core/data-server";
import * as t from "io-ts";
import * as common from "../../data/io-ts";
import type * as q from "querystring";

export const urlParameter = <T>(
  validator: data.StringParameterTransform<T, common.ValidationError>,
  regExp?: RegExp,
): data.URLDataParameterValidatorSpec<T, common.ValidationError> => ({
  regExp: regExp ?? data.defaultParameterRegExp(),
  validator,
});

export const queryValidator = <
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: data.StringParameterTransform<
      unknown,
      common.ValidationError
    >;
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
  { [P in TRequired]: data.DataValidatorOutput<TValidation[P]> } & {
    [P in TOptional]?: data.DataValidatorOutput<TValidation[P]>;
  },
  TRequired | TOptional,
  common.ValidationError
> => {
  const initialValidator = common.plainValidator(
    t.exact(
      t.intersection([
        t.type(Object.fromEntries(required.map((r) => [r, t.string]))),
        t.partial(Object.fromEntries(optional.map((o) => [o, t.string]))),
      ]),
    ),
  );
  const paramValidators = validation;
  const finalValidator = data.transitiveDataValidation(
    initialValidator,
    (data) => {
      const finalResult: Record<string, unknown> = {};
      const errors: common.ValidationError = [];
      for (const [key, dataItemIter] of Object.entries(data)) {
        // If data item is undefined, it means that it has passed initial validation.
        // The initial validation makes sure that only optional query parameters accept undefined value.
        // Therefore, we can just skip undefined ones here.
        if (dataItemIter !== undefined) {
          const paramValidationResult =
            paramValidators[key as keyof typeof paramValidators](dataItemIter);
          switch (paramValidationResult.error) {
            case "none":
              finalResult[key] = paramValidationResult.data;
              break;
            default:
              errors.push(...paramValidationResult.errorInfo);
          }
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
        { [P in TRequired]: data.DataValidatorOutput<TValidation[P]> } & {
          [P in TOptional]?: data.DataValidatorOutput<TValidation[P]>;
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

export interface QueryValidatorPropertySpec<
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: data.StringParameterTransform<
      unknown,
      common.ValidationError
    >;
  },
> {
  required: ReadonlyArray<TRequired>;
  optional: ReadonlyArray<TOptional>;
  validation: TValidation;
}
