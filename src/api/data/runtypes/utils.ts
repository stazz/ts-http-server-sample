import * as core from "../../core/core";
import * as t from "runtypes";
import type * as error from "./error";

export const transformLibraryResultToModelResult = <TData>(
  validationResult: t.Result<TData>,
): core.DataValidatorResult<TData, error.ValidationError> =>
  validationResult.success
    ? {
        error: "none",
        data: validationResult.value,
      }
    : {
        error: "error",
        errorInfo: [core.omit(validationResult, "success")],
      };

export const exceptionAsValidationError = (
  input: unknown, // TODO maybe make ValidationError include optional 'value' property?
  exception: unknown,
): error.ValidationError => [
  {
    code: t.Failcode.CONTENT_INCORRECT,
    message: `${exception}`,
  },
];
