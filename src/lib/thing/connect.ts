export const connectToAnotherThing = (
  thisThingId: string,
  anotherThingId: string,
) => {
  // Do the connection in DB...
  return {
    connected: true,
    // Use Date just to demonstrate how to convert non-conventional objects to JSON response in index.ts
    connectedAt: new Date(),
  };
};
