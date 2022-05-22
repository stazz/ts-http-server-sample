export const connectToAnotherThing = (
  thisThingId: string,
  anotherThingId: string,
) => {
  // Do the connection in DB...
  return {
    connected: true,
    connectedAt: new Date(),
  };
};
