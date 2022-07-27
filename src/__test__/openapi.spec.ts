// This is less of a unit test and more of a integration test
// But let's run this with AVA nevertheless.
import test, { ExecutionContext } from "ava";
import type * as data from "../api/data-client/common";
import type * as events from "./events";
import * as invoke from "./invokeHTTP";
import * as integrationTest from "./integration-test";
import type { OpenAPIV3 as openapi } from "openapi-types";

integrationTest.testEveryCombination(
  // AVA runtime
  test,
  // Expected amount of assertions by the actual test function
  2,
  // Extra test arguments - unused in this case
  () => [undefined],
  // Title for single test
  ({ serverID, dataValidationID }) =>
    `Unsuccessful invocation test for: server "${serverID}", BE data validation "${dataValidationID}".`,
  // Actual test function for single test
  async ({ c, host, port, username, password }) => {
    await runTestsForUnsuccessfulResults(
      c,
      invoke.createCallHTTPEndpoint(host, port),
      username,
      password,
    );
    return expectedEvents(username);
  },
);

const runTestsForUnsuccessfulResults = async (
  c: ExecutionContext,
  invoker: data.CallHTTPEndpoint,
  username: string,
  password: string,
) => {
  // When invoking OpenAPI endpoint without authentication, the returned OpenAPI document should not show security schemes or endpoints which are with authorization.
  await runTestForAPIDoc(
    c,
    invoker,
    {},
    openAPIDocumentWithoutSchemaDescriptions({
      title: "Sample REST API (Unauthenticated)",
    }),
  );

  // When invoking OpenAPI endpoint with authentication, the returned OpenAPI document should expose security schemes and endpoints which are using the schemes.
  await runTestForAPIDoc(
    c,
    invoker,
    {
      headers: {
        Authorization: integrationTest.getBasicAuthorizationHeaderValue(
          username,
          password,
        )(),
      },
    },
    openAPIDocumentWithoutSchemaDescriptions({
      title: "Sample REST API (Authenticated)",
      securitySchemes: {
        authentication: {
          type: "http",
          scheme: "basic",
        },
      },
      extraPaths: authenticatedPathObjectsWithoutSchemaDescriptions,
    }),
  );
};

const runTestForAPIDoc = async (
  c: ExecutionContext,
  invoker: data.CallHTTPEndpoint,
  httpArgs: Omit<data.HTTPInvocationArguments, "method" | "url">,
  expectedDocumentWithoutSchemaDescriptions: openapi.Document,
) => {
  const openAPIDoc = await invoker({
    ...httpArgs,
    method: "GET",
    url: "/api-md",
  });
  stripDescriptionsFromSchema(openAPIDoc);
  c.deepEqual(openAPIDoc, expectedDocumentWithoutSchemaDescriptions);
};

const expectedEvents = (username: string): Array<events.LoggedEvents> => [
  // Unauthenticated invocation
  {
    eventName: "onSuccessfulInvocationStart",
    eventData: {
      groups: {
        e_0: undefined,
        e_0_api_0: undefined,
        e_0_api_0_thing_0: undefined,
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2: undefined,
        e_0_api_0_thing_2_id: undefined,
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: "/api-md",
      },
      state: {},
    },
  },
  {
    eventName: "onSuccessfulInvocationEnd",
    eventData: {
      groups: {
        e_0: undefined,
        e_0_api_0: undefined,
        e_0_api_0_thing_0: undefined,
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2: undefined,
        e_0_api_0_thing_2_id: undefined,
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: "/api-md",
      },
      state: {},
    },
  },
  // Authenticated invocation
  {
    eventName: "onSuccessfulInvocationStart",
    eventData: {
      groups: {
        e_0: undefined,
        e_0_api_0: undefined,
        e_0_api_0_thing_0: undefined,
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2: undefined,
        e_0_api_0_thing_2_id: undefined,
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: "/api-md",
      },
      state: {
        username,
      },
    },
  },
  {
    eventName: "onSuccessfulInvocationEnd",
    eventData: {
      groups: {
        e_0: undefined,
        e_0_api_0: undefined,
        e_0_api_0_thing_0: undefined,
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2: undefined,
        e_0_api_0_thing_2_id: undefined,
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: "/api-md",
      },
      state: {
        username,
      },
    },
  },
];

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

const openAPIDocumentWithoutSchemaDescriptions = ({
  title,
  extraPaths,
  securitySchemes,
}: OpenAPIDocumentInput): openapi.Document => {
  const doc: openapi.Document = {
    info: {
      title,
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
      ...(extraPaths ?? {}),
    },
  };
  if (securitySchemes) {
    doc.components = {
      ...(doc.components ?? {}),
      securitySchemes: {
        ...(doc.components?.securitySchemes ?? {}),
        ...securitySchemes,
      },
    };
  }
  return doc;
};

const authenticatedPathObjectsWithoutSchemaDescriptions: openapi.PathsObject = {
  "/api/secret": {
    get: {
      responses: {
        "204": {
          description: "No data in output",
        },
      },
      security: [
        {
          authentication: [],
        },
      ],
    },
    parameters: [],
  },
};

interface OpenAPIDocumentInput {
  title: string;
  extraPaths?: openapi.PathsObject;
  securitySchemes?: openapi.ComponentsObject["securitySchemes"];
}
