export const queryThings = (
  includeDeleted: boolean,
  lastModified: Date | undefined,
): Array<{ property: string }> => {
  // Get the things from DB, maybe with pagination in the future
  return [];
};

export const queryThing = (id: string, includeDeleted: boolean) => {
  // Get the thing from DB..
  // Return some data
  return id;
};
