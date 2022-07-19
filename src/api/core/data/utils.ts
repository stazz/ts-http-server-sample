import type * as common from "./common";

export const transitiveDataValidation =
  <TInput, TOutput, TIntermediate>(
    first: common.DataValidator<TInput, TIntermediate>,
    second: common.DataValidator<TIntermediate, TOutput>,
  ): common.DataValidator<TInput, TOutput> =>
  (input) => {
    const intermediate = first(input);
    switch (intermediate.error) {
      case "none":
        return second(intermediate.data);
      default:
        return intermediate;
    }
  };

export const omit = <T, TKey extends keyof T>(
  obj: T,
  ...keys: ReadonlyArray<TKey>
) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => keys.indexOf(key as TKey) < 0),
  ) as Omit<T, TKey>;
};

// Adding monadic support for common.DataValidationResultError
export const combineErrorObjects = (
  errors: ReadonlyArray<common.DataValidatorResultError>,
): common.DataValidatorResultError => ({
  error: "error",
  errorInfo: errors,
  getHumanReadableMessage: () =>
    errors.map((e) => e.getHumanReadableMessage()).join("\n"),
});
