import * as data from "../../api/core/data";
import * as tPlugin from "../../api/data/runtypes";
import type * as common from "../../api/data-client/common";
import * as apiCall from "../../api/data-client/runtypes";
import type * as protocol from "../../protocol";
import * as t from "runtypes";

export const createBackend = <
  THeaders extends Record<"auth", common.HeaderProvider>,
>(
  invokeHTTPEndpoint: common.CallHTTPEndpoint,
  headers: THeaders,
) => {
  // This is RFC-adhering UUID regex. Relax if needed.
  // Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
  const uuid = t.String.withConstraint(
    (str) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.exec(
        str,
      ) != null,
  );
  const thingData = t.Record({
    property: uuid,
  });
  const query = tPlugin.plainValidator(
    t.Record({
      includeDeleted: t.Boolean.optional(),
    }),
  );

  const factory = apiCall
    .createAPICallFactory(invokeHTTPEndpoint)
    .withHeaders(headers);

  const getThings = factory.makeAPICall<protocol.APIGetThings>("GET", {
    method: tPlugin.plainValidator(t.Literal("GET")),
    url: "/api/thing",
    query: data.transitiveDataValidation(
      tPlugin.plainValidator(
        t.Record({
          includeDeleted: t.Boolean.optional(),
          lastModified: t.InstanceOf(Date).optional(),
        }),
      ),
      ({ lastModified, ...q }) => ({
        error: "none",
        data: {
          lastModified: lastModified?.toISOString(),
          ...q,
        },
      }),
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
          // Adopted (made Z and time offset spec mutually exclusive) from comment in here: https://stackoverflow.com/questions/3143070/javascript-regex-iso-datetime
          // It's not 100% foolproof, but at least it stops other, non-ISO formats accepted by Date constructor
          connectedAt: t.String.withConstraint(
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
          ? data.exceptionAsValidationError(
              `Not a valid ISO timestamp string "${connectedAt}".`,
            )
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
