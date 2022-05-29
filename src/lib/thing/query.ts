// This folder knows nothing about things like REST API/HTTP Server/Etc!
export const queryThing = (id: string, includeDeleted: boolean) => {
  // eslint-disable-next-line no-console
  console.log(`QUERY ${id} ${includeDeleted}`);
  // Get the thing from DB..
  // Return some data
  return id;
};
