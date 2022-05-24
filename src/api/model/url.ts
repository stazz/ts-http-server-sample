export interface URLDataTransformer<T> {
  regexp: RegExp;
  transform: (
    matchedString: string,
    /* later - groups: Array<string> */
  ) => T;
}

const DEFAULT_PARAM_REGEXP = /[^/]+/;
export function defaultParameter(): URLDataTransformer<string>;
export function defaultParameter<T>(
  transform: (matchedString: string) => T,
): URLDataTransformer<T>;
export function defaultParameter<T>(
  transform?: (matchedString: string) => T,
): URLDataTransformer<T> {
  return {
    regexp: DEFAULT_PARAM_REGEXP,
    transform: transform ?? ((str) => str as unknown as T),
  };
}

export function regexpParameter(
  regexp: URLDataTransformer<string>["regexp"],
): URLDataTransformer<string>;
export function regexpParameter<T>(
  regexp: URLDataTransformer<T>["regexp"],
  transform: URLDataTransformer<T>["transform"],
): URLDataTransformer<T>;
export function regexpParameter<T>(
  regexp: URLDataTransformer<T>["regexp"],
  transform?: URLDataTransformer<T>["transform"],
): URLDataTransformer<T> {
  return {
    regexp,
    transform: transform ?? ((str) => str as unknown as T),
  };
}
