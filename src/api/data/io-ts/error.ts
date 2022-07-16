import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";

export type ValidationError = t.Errors;

export const getHumanReadableErrorMessage = (error: ValidationError) =>
  PathReporter.report({
    _tag: "Left",
    left: error,
  }).join("  \n");

export const exceptionAsValidationError = (
  input: unknown,
  exception: unknown,
): ValidationError => [
  {
    value: input,
    message: `${exception}`,
    context: [],
  },
];
