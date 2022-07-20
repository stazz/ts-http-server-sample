import type * as data from "../../core/data";
import * as t from "zod";

export type ValidationError = Array<t.ZodError<unknown>>;

export const getHumanReadableErrorMessage = (errors: ValidationError) =>
  errors.map((e) => e.message).join("\n");

export const createErrorObject = (
  errorInfo: ValidationError,
): data.DataValidatorResultError => ({
  error: "error",
  errorInfo,
  getHumanReadableMessage: () => getHumanReadableErrorMessage(errorInfo),
});
