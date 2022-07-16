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
