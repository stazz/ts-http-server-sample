import * as core from "../../core/core";
import * as t from "zod";
import type * as error from "./error";

export const transformLibraryResultToModelResult = <TData>(
  validationResult: t.SafeParseReturnType<unknown, TData>,
): core.DataValidatorResult<TData, error.ValidationError> =>
  validationResult.success
    ? {
        error: "none",
        data: validationResult.data,
      }
    : {
        error: "error",
        errorInfo: [validationResult.error],
      };

export const exceptionAsValidationError = (
  input: unknown, // TODO maybe make ValidationError include optional 'value' property?
  exception: unknown,
): error.ValidationError => [
  t.ZodError.create([
    {
      code: "custom",
      path: [""],
      message: `${exception}`,
    },
  ]),
];
