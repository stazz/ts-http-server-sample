export const queryThings = (
  includeDeleted: boolean,
  lastModified: Date | undefined,
): Array<unknown> => {
  // eslint-disable-next-line no-console
  console.log(`QUERY ALL ${includeDeleted} ${lastModified}`);
  // Get the things from DB, maybe with pagination in the future
  return [];
};

export const queryThing = (id: string, includeDeleted: boolean) => {
  // eslint-disable-next-line no-console
  console.log(`QUERY ${id} ${includeDeleted}`);
  // Get the thing from DB..
  // Return some data
  return id;
};
