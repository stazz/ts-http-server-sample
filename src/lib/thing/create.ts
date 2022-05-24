// This folder knows nothing about things like REST API/HTTP Server/Etc!
export const createThing = (property: string, username: string) => {
  // Create thing in DB...
  // Maybe check permissions for username, or extract correct DB schema name from it?
  // Return some data
  return { property };
};
