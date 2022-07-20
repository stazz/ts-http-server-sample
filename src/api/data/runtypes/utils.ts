import * as data from "../../core/data-server";
import * as t from "runtypes";
import * as error from "./error";

export const transformLibraryResultToModelResult = <TData>(
  validationResult: t.Result<TData>,
): data.DataValidatorResult<TData> => {
  if (validationResult.success) {
    return {
      error: "none",
      data: validationResult.value,
    };
  } else {
    const errorInfo = [data.omit(validationResult, "success")];
    return {
      error: "error",
      errorInfo,
      getHumanReadableMessage: () =>
        error.getHumanReadableErrorMessage(errorInfo),
    };
  }
};
