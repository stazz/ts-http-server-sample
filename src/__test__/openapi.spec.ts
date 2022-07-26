// This is less of a unit test and more of a integration test
// But let's run this with AVA nevertheless.
import test, { ExecutionContext } from "ava";
import type * as data from "../api/data-client/common";
import type * as events from "./events";
import * as invoke from "./invokeHTTP";
import * as integrationTest from "./integration-test";

integrationTest.testEveryCombination(
  // AVA runtime
  test,
  // Expected amount of assertions by the actual test function
  15,
  // Extra test arguments - unused in this case
  () => [undefined],
  // Title for single test
  ({ serverID, dataValidationID }) =>
    `Unsuccessful invocation test for: server "${serverID}", BE data validation "${dataValidationID}".`,
  // Actual test function for single test
  async ({ c, host, port, dataValidationID }) => {
    await runTestsForUnsuccessfulResults(
      c,
      invoke.createCallHTTPEndpoint(host, port),
    );
    return expectedEvents();
  },
);

const runTestsForUnsuccessfulResults = async (
  c: ExecutionContext,
  invoker: data.CallHTTPEndpoint,
) => {
  const openAPIDoc = await invoker({
    method: "GET",
    url: "/api-md",
  });
  stripDescriptionsFromSchema(openAPIDoc);
  c.deepEqual(openAPIDoc, {
    components: {
      securitySchemes: {},
    },
    info: {
      title: "Sample REST API (Unauthenticated)",
      version: "0.1",
    },
    openapi: "3.0.3",
    paths: {
      "/api/thing": {
        get: {
          parameters: [
            {
              in: "query",
              name: "includeDeleted",
              required: false,
            },
            {
              in: "query",
              name: "lastModified",
              required: false,
            },
          ],
          responses: {
            "200": {
              content: {
                "application/json": {
                  example: [],
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        property: {
                          type: "string",
                        },
                      },
                      required: ["property"],
                    },
                  },
                },
              },
              description: "Output description",
            },
          },
          summary: "Query things",
        },
        parameters: [],
        post: {
          requestBody: {
            content: {
              "application/json": {
                example: {
                  property: "00000000-0000-0000-0000-000000000000",
                },
                schema: {
                  type: "object",
                  required: ["property"],
                  properties: {
                    property: {
                      type: "string",
                    },
                  },
                },
              },
            },
            required: true,
          },
          responses: {
            "200": {
              content: {
                "application/json": {
                  example: {
                    property: "00000000-0000-0000-0000-000000000000",
                  },
                  schema: {
                    type: "object",
                    properties: {
                      property: {
                        type: "string",
                      },
                    },
                    required: ["property"],
                  },
                },
              },
              description: "Output description",
            },
          },
          summary: "Create a thing",
        },
        summary: "Query things, or create thing",
      },
      "/api/thing/{id}": {
        get: {
          parameters: [
            {
              in: "query",
              name: "includeDeleted",
              required: false,
            },
          ],
          responses: {
            "200": {
              content: {
                "application/json": {
                  example: "Example",
                  schema: {
                    type: "string",
                  },
                },
              },
              description: "Output description",
            },
          },
          summary: "Query a thing",
        },
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            content: {
              "text/plain": {
                schema: {
                  pattern: "[^/]+",
                  type: "string",
                },
              },
            },
          },
        ],
        summary: "Get thing",
      },
      "/api/thing/{id}/connectToAnotherThing": {
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            content: {
              "text/plain": {
                schema: {
                  pattern:
                    "[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}",
                  type: "string",
                },
              },
            },
          },
        ],
        post: {
          requestBody: {
            content: {
              "application/json": {
                example: {
                  anotherThingId: "00000000-0000-0000-0000-000000000000",
                },
                schema: {
                  type: "object",
                  properties: {
                    anotherThingId: {
                      type: "string",
                    },
                  },
                  required: ["anotherThingId"],
                },
              },
            },
            required: true,
          },
          responses: {
            "200": {
              content: {
                "application/json": {
                  example: {
                    connected: true,
                    connectedAt: "1970-01-01T00:00:00.000Z",
                  },
                  schema: {
                    type: "object",
                    properties: {
                      connected: {
                        type: "boolean",
                      },
                      connectedAt: {
                        type: "string",
                      },
                    },
                    required: ["connected", "connectedAt"],
                  },
                },
              },
              description: "Output description",
            },
          },
          summary: "Connect one thing to another",
        },
        summary: "Connect two things",
      },
    },
  });
};

const expectedEvents = (): Array<events.LoggedEvents> => [];

const stripDescriptionsFromSchema = (value: unknown) => {
  if (value && typeof value === "object") {
    // Don't strip descriptions from other OpenAPI object than schema
    // We check whether something is schema if it has 'type' in it, as it is enough for our simple example.
    if ("type" in value && "description" in value) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      delete (value as any)["description"];
    }
    if (Array.isArray(value)) {
      value.forEach(stripDescriptionsFromSchema);
    } else {
      Object.values(value).forEach(stripDescriptionsFromSchema);
    }
  }
};
