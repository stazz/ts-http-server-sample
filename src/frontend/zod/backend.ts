import * as data from "../../api/core/data";
import * as tPlugin from "../../api/data/zod";
import type * as common from "../../api/data-client/common";
import * as apiCall from "../../api/data-client/zod";
import type * as protocol from "../../protocol";
import * as t from "zod";

const uuid = t.string().refine((str) => true);
export const createBackend = () => {
  const thingData = t.object({
    property: uuid,
  });
  const query = tPlugin.plainValidator(
    t.object({
      includeDeleted: t.boolean().optional(),
    }),
  );

  const factory = apiCall
    .createAPICallFactory(someMethodToInvokeHTTPEndpoint)
    .withHeaders({
      // Key: functionality IDs used by protocol
      // Value: callback implementing functionality
      auth: () => `Basic ${Buffer.from("secret:secret").toString("base64")}`,
    });

  const getThings = factory.makeAPICall<protocol.APIGetThings>("GET", {
    method: tPlugin.plainValidator(t.literal("GET")),
    url: "/api/thing",
    query: tPlugin.plainValidator(
      t.object({
        includeDeleted: t.boolean().optional(),
        // lastModified: tt.DateFromISOString,
      }),
    ),
    response: tPlugin.plainValidator(t.array(thingData)),
  });

  const createThing = factory.makeAPICall<protocol.APICreateThing>("POST", {
    method: tPlugin.plainValidator(t.literal("POST")),
    url: "/api/thing",
    body: tPlugin.plainValidator(thingData),
    response: tPlugin.plainValidator(thingData),
  });

  const getThing = factory.makeAPICall<protocol.APIGetThing>("GET", {
    method: tPlugin.plainValidator(t.literal("GET")),
    url: data.transitiveDataValidation(
      tPlugin.plainValidator(t.type({ id: tt.UUID })),
      ({ id }) => ({
        error: "none",
        data: `/api/thing/${id}`,
      }),
    ),
    query,
    response: tPlugin.plainValidator(tt.UUID),
  });

  const connectThings = factory.makeAPICall<protocol.APIConnectThings>("POST", {
    method: tPlugin.plainValidator(t.literal("POST")),
    url: data.transitiveDataValidation(
      tPlugin.plainValidator(t.type({ id: tt.UUID })),
      ({ id }) => ({
        error: "none",
        data: `/api/thing/${id}/connectToAnotherThing`,
      }),
    ),
    body: tPlugin.plainValidator(
      t.type({
        anotherThingId: tt.UUID,
      }),
    ),
    response: tPlugin.plainValidator(
      t.type({
        connected: t.boolean,
        connectedAt: tt.DateFromISOString,
      }),
    ),
  });

  const authenticated = factory.makeAPICall<protocol.APIAuthenticated>("GET", {
    method: tPlugin.plainValidator(t.literal("GET")),
    url: "/api/secret",
    headers: {
      Authorization: "auth",
    },
    response: tPlugin.plainValidator(t.undefined),
  });

  return {
    getThings,
    getThing,
    createThing,
    connectThings,
    authenticated,
  };
};

// This simulates library like e.g. got
export const someMethodToInvokeHTTPEndpoint = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: common.HTTPInvocationArguments,
): Promise<unknown> => {
  throw new Error(
    "This exists only to simulate signature of some way of invoking HTTP endpoint in the client.",
  );
};
