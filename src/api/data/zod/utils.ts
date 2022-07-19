import type * as data from "../../core/data-server";
import * as t from "zod";
import * as error from "./error";

export const transformLibraryResultToModelResult = <TData>(
  validationResult: t.SafeParseReturnType<unknown, TData>,
): data.DataValidatorResult<TData> => {
  if (validationResult.success) {
    return {
      error: "none",
      data: validationResult.data,
    };
  } else {
    const errorInfo = [validationResult.error];
    return {
      error: "error",
      errorInfo,
      getHumanReadableMessage: () =>
        error.getHumanReadableErrorMessage(errorInfo),
    };
  }
};

export const maybeDescribe = <TType extends t.ZodType>(
  validation: TType,
  description: string | undefined,
) =>
  description === undefined ? validation : validation.describe(description);
