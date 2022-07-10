import * as common from "..";
import * as tPlugin from "../../api/data/io-ts";
import * as data from "../../api/core/data";
import type * as protocol from "../../protocol";
import * as t from "io-ts";
import * as tt from "io-ts-types";

export const createBackend = () => {
  const thingData = t.type({
    property: tt.UUID,
  });
  const query = tPlugin.plainValidatorEncoder(
    t.partial({
      includeDeleted: t.boolean,
    }),
  );

  const factory = common
    .withDataValidation(tPlugin.plainValidator(t.undefined))
    .withHeaders({
      // Key: functionality IDs used by protocol
      // Value: callback implementing functionality
      auth: () => `Basic ${Buffer.from("secret:secret").toString("base64")}`,
    });

  const getThings = factory.makeAPICall<protocol.APIGetThings>("GET", {
    method: tPlugin.plainValidator(t.literal("GET")),
    url: "/api/thing",
    query: tPlugin.plainValidatorEncoder(
      t.partial({
        includeDeleted: t.boolean,
        lastModified: tt.DateFromISOString,
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
