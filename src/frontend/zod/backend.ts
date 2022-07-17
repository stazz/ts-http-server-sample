import * as data from "../../api/core/data";
import * as tPlugin from "../../api/data/zod";
import type * as common from "../../api/data-client/common";
import * as apiCall from "../../api/data-client/zod";
import type * as protocol from "../../protocol";
import * as t from "zod";

export const createBackend = (invokeHTTPEndpoint: common.CallHTTPEndpoint) => {
  // This is RFC-adhering UUID regex. Relax if needed.
  // Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
  const uuid = t
    .string()
    .refine(
      (str) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.exec(
          str,
        ) != null,
    );

  const thingData = t.object({
    property: uuid,
  });
  const query = tPlugin.plainValidator(
    t.object({
      includeDeleted: t.boolean().optional(),
    }),
  );

  const factory = apiCall.createAPICallFactory(invokeHTTPEndpoint).withHeaders({
    // Key: functionality IDs used by protocol
    // Value: callback implementing functionality
    auth: () => `Basic ${Buffer.from("secret:secret").toString("base64")}`,
  });

  const getThings = factory.makeAPICall<protocol.APIGetThings>("GET", {
    method: tPlugin.plainValidator(t.literal("GET")),
    url: "/api/thing",
    query: data.transitiveDataValidation(
      tPlugin.plainValidator(
        t.object({
          includeDeleted: t.boolean().optional(),
          lastModified: t.instanceof(Date),
        }),
      ),
      ({ lastModified, ...q }) => ({
        error: "none",
        data: {
          lastModified: lastModified.toISOString(),
          ...q,
        },
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
      tPlugin.plainValidator(t.object({ id: uuid })),
      ({ id }) => ({
        error: "none",
        data: `/api/thing/${id}`,
      }),
    ),
    query,
    response: tPlugin.plainValidator(uuid),
  });

  const connectThings = factory.makeAPICall<protocol.APIConnectThings>("POST", {
    method: tPlugin.plainValidator(t.literal("POST")),
    url: data.transitiveDataValidation(
      tPlugin.plainValidator(t.object({ id: uuid })),
      ({ id }) => ({
        error: "none",
        data: `/api/thing/${id}/connectToAnotherThing`,
      }),
    ),
    body: tPlugin.plainValidator(
      t.object({
        anotherThingId: uuid,
      }),
    ),
    response: data.transitiveDataValidation(
      tPlugin.plainValidator(
        t.object({
          connected: t.boolean(),
          connectedAt: t
            .string()
            // Adopted (made Z and time offset spec mutually exclusive) from comment in here: https://stackoverflow.com/questions/3143070/javascript-regex-iso-datetime
            // It's not 100% foolproof, but at least it stops other, non-ISO formats accepted by Date constructor
            .refine(
              (str) =>
                /^[+-]?\d{4}(-[01]\d(-[0-3]\d(T[0-2]\d:[0-5]\d:?([0-5]\d(\.\d+)?)?(([+-][0-2]\d:[0-5]\d)|Z)?)?)?)?$/.exec(
                  str,
                ) != null,
            ),
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
    method: tPlugin.plainValidator(t.literal("GET")),
    url: "/api/secret",
    headers: {
      Authorization: "auth",
    },
    response: tPlugin.plainValidator(t.undefined()),
  });

  return {
    getThings,
    getThing,
    createThing,
    connectThings,
    authenticated,
  };
};
