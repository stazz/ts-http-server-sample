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

export const exceptionAsValidationError = (
  exception: unknown,
): common.DataValidatorResultError => ({
  error: "error",
  errorInfo: exception,
  getHumanReadableMessage: () => `${exception}`,
});

export const transformEntries = <T extends Record<string, unknown>, TResult>(
  record: T,
  transform: (item: T[keyof T], paramName: keyof T) => TResult,
): { [P in keyof T]: ReturnType<typeof transform> } => {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      transform(value as Parameters<typeof transform>[0], key),
    ]),
  ) as { [P in keyof T]: ReturnType<typeof transform> };
};
