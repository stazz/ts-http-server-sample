import * as t from "zod";

export type ValidationError = Array<t.ZodError<unknown>>;

export const getHumanReadableErrorMessage = (errors: ValidationError) =>
  errors.map((e) => e.format()._errors.join("\n  ")).join("\n");
