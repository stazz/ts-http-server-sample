import type * as backend from "./backend";

const invokeRestAPI = async ({
  getThings,
  createThing,
  getThing,
  connectThings,
  authenticated,
}: ReturnType<typeof backend.createBackend>) => {
  const allThings = await getThings({
    query: { includeDeleted: true, lastModified: new Date() },
  });
  const createdThing = await createThing({
    body: { property: "00000000-0000-0000-0000-000000000000" },
  });
  const queriedThing = await getThing({
    url: { id: "00000000-0000-0000-0000-000000000000" },
    query: { includeDeleted: false },
  });
  const connectionInfo = await connectThings({
    url: { id: "00000000-0000-0000-0000-000000000000" },
    body: { anotherThingId: "00000000-0000-0000-0000-000000000000" },
  });
  if (connectionInfo.error === "none") {
    // timestamp is of type Date
    const timestamp = connectionInfo.data.connectedAt;
  }
  const none = await authenticated();
};
