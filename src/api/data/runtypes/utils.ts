import * as data from "../../core/data-server";
import * as t from "runtypes";
import type * as error from "./error";

export const transformLibraryResultToModelResult = <TData>(
  validationResult: t.Result<TData>,
): data.DataValidatorResult<TData, error.ValidationError> =>
  validationResult.success
    ? {
        error: "none",
        data: validationResult.value,
      }
    : {
        error: "error",
        errorInfo: [data.omit(validationResult, "success")],
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
