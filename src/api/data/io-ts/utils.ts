import type * as data from "../../core/data";
import * as t from "io-ts";
import type * as error from "./error";

export const transformLibraryResultToModelResult = <TData>(
  validationResult: t.Validation<TData>,
): data.DataValidatorResult<TData, error.ValidationError> =>
  validationResult._tag === "Right"
    ? {
        error: "none",
        data: validationResult.right,
      }
    : {
        error: "error",
        errorInfo: validationResult.left,
      };

export const exceptionAsValidationError = (
  input: unknown,
  exception: unknown,
): error.ValidationError => [
  {
    value: input,
    message: `${exception}`,
    context: [],
  },
];
