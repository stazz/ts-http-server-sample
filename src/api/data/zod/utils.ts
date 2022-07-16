import type * as data from "../../core/data-server";
import * as t from "zod";
import type * as error from "./error";

export const transformLibraryResultToModelResult = <TData>(
  validationResult: t.SafeParseReturnType<unknown, TData>,
): data.DataValidatorResult<TData, error.ValidationError> =>
  validationResult.success
    ? {
        error: "none",
        data: validationResult.data,
      }
    : {
        error: "error",
        errorInfo: [validationResult.error],
      };

export const maybeDescribe = <TType extends t.ZodType>(
  validation: TType,
  description: string | undefined,
) =>
  description === undefined ? validation : validation.describe(description);
