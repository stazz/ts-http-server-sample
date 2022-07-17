import type * as common from "./common";

export const transitiveDataValidation =
  <TInput, TOutput, TIntermediate, TError>(
    first: common.DataValidator<TInput, TIntermediate, TError>,
    second: common.DataValidator<TIntermediate, TOutput, TError>,
  ): common.DataValidator<TInput, TOutput, TError> =>
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
