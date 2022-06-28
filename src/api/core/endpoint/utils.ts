// From https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string

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
