import * as data from "../../core/data-server";
import * as t from "zod";
import * as common from "../../data/zod";
import type * as q from "querystring";

export const urlParameter = <T>(
  validator: data.StringParameterTransform<T>,
  regExp?: RegExp,
): data.URLDataParameterValidatorSpec<T> => ({
  regExp: regExp ?? data.defaultParameterRegExp(),
  validator,
});

export const queryValidator = <
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: data.StringParameterTransform<unknown>;
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
  TRequired | TOptional
> => {
  const initialValidator = common.plainValidator(
    t.strictObject({
      ...Object.fromEntries(required.map((r) => [r, t.string()])),
      ...Object.fromEntries(optional.map((o) => [o, t.string().optional()])),
    }),
  );
  const paramValidators = validation;
  const finalValidator = data.transitiveDataValidation(
    initialValidator,
    (qData) => {
      const finalResult: Record<string, unknown> = {};
      const errors: Array<data.DataValidatorResultError> = [];
      for (const [key, dataItemIter] of Object.entries(qData)) {
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
              errors.push(paramValidationResult);
          }
        }
      }
      return errors.length > 0
        ? data.combineErrorObjects(errors)
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
        }
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
    [P in TRequired | TOptional]: data.StringParameterTransform<unknown>;
  },
> {
  required: ReadonlyArray<TRequired>;
  optional: ReadonlyArray<TOptional>;
  validation: TValidation;
}
