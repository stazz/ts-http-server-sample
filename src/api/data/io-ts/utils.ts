import * as t from "io-ts";
import type * as data from "../../core/data-server";
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
