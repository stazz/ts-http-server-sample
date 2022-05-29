// From https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string

export const omit = <T, TKey extends keyof T>(
  obj: T,
  ...keys: ReadonlyArray<TKey>
) => {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key]) => keys.indexOf(key as TKey) < 0)
      .map(([key, value]) => [key, value] as const),
  ) as Omit<T, TKey>;
};
