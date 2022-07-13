import * as data from "../../api/core/data";
import * as tPlugin from "../../api/data/runtypes";
import type * as common from "../../api/data-client/common";
import * as apiCall from "../../api/data-client/runtypes";
import type * as protocol from "../../protocol";
import * as t from "runtypes";

const uuid = t.String.withConstraint((str) => true); // TODO
export const createBackend = () => {
  const thingData = t.Record({
    property: uuid,
  });
  const query = tPlugin.plainValidator(
    t.Record({
      includeDeleted: t.Boolean.optional(),
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
    method: tPlugin.plainValidator(t.Literal("GET")),
    url: "/api/thing",
    query: tPlugin.encoderValidator(
      tPlugin.encoder(
        t.Record({
          includeDeleted: t.Boolean.optional(),
          lastModified: t.InstanceOf(Date).optional(),
        }),
        // TODO "stripUndefineds" method.
        ({ lastModified, ...q }) => ({
          lastModified: lastModified?.toISOString(),
          ...q,
        }),
      ),
    ),
    response: tPlugin.plainValidator(t.Array(thingData)),
  });

  const createThing = factory.makeAPICall<protocol.APICreateThing>("POST", {
    method: tPlugin.plainValidator(t.Literal("POST")),
    url: "/api/thing",
    body: tPlugin.plainValidator(thingData),
    response: tPlugin.plainValidator(thingData),
  });

  const getThing = factory.makeAPICall<protocol.APIGetThing>("GET", {
    method: tPlugin.plainValidator(t.Literal("GET")),
    url: data.transitiveDataValidation(
      tPlugin.plainValidator(t.Record({ id: uuid })),
      ({ id }) => ({
        error: "none",
        data: `/api/thing/${id}`,
      }),
    ),
    query,
    response: tPlugin.plainValidator(uuid),
  });

  const connectThings = factory.makeAPICall<protocol.APIConnectThings>("POST", {
    method: tPlugin.plainValidator(t.Literal("POST")),
    url: data.transitiveDataValidation(
      tPlugin.plainValidator(t.Record({ id: uuid })),
      ({ id }) => ({
        error: "none",
        data: `/api/thing/${id}/connectToAnotherThing`,
      }),
    ),
    body: tPlugin.plainValidator(
      t.Record({
        anotherThingId: uuid,
      }),
    ),
    response: data.transitiveDataValidation(
      tPlugin.plainValidator(
        t.Record({
          connected: t.Boolean,
          connectedAt: t.String, // tt.DateFromISOString,
        }),
      ),
      ({ connectedAt, ...r }) => {
        const theDate = new Date(connectedAt);
        return isNaN(theDate.valueOf())
          ? {
              error: "error",
              errorInfo: tPlugin.exceptionAsValidationError(
                connectedAt,
                theDate,
              ),
            }
          : {
              error: "none",
              data: {
                connectedAt: theDate,
                ...r,
              },
            };
      },
    ),
  });

  const authenticated = factory.makeAPICall<protocol.APIAuthenticated>("GET", {
    method: tPlugin.plainValidator(t.Literal("GET")),
    url: "/api/secret",
    headers: {
      Authorization: "auth",
    },
    response: tPlugin.plainValidator(t.Undefined),
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
