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

// Without TFactoryReturnValue, we will get some problems in things like getOrAddGeneric(dictionary, tableID.databaseName, () => ({})), when values are dictionaries

export const getOrAddGeneric = <
  TKey extends keyof any, // eslint-disable-line @typescript-eslint/no-explicit-any
  TValue,
  TFactoryReturnValue extends TValue,
>(
  dictionary: Record<TKey, TValue>,
  key: TKey,
  factory: (key: TKey) => TFactoryReturnValue,
) => {
  let value = dictionary[key];
  if (!value) {
    dictionary[key] = value = factory(key);
  }
  return value;
};
