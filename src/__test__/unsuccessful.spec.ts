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
  13,
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
    return expectedEvents(errorsForDataValidationFrameworks[dataValidationID]);
  },
);

const runTestsForUnsuccessfulResults = async (
  c: ExecutionContext,
  invoker: data.CallHTTPEndpoint,
) => {
  // Run these sequentially, to ensure correct event order of server events
  await integrationTest.assertUnsuccessfulResult(
    c,
    invoker,
    {
      method: "GET",
      url: "/dummy",
    },
    404,
  );
  await integrationTest.assertUnsuccessfulResult(
    c,
    invoker,
    {
      method: "PUT",
      url: "/api/thing",
      body: {
        property: integrationTest.zeroUUID,
      },
    },
    405,
    (response) => c.deepEqual(response.headers["allow"], "POST,GET"),
  );

  await integrationTest.assertUnsuccessfulResult(
    c,
    invoker,
    {
      method: "POST",
      url: "/api/thing",
      body: {
        property: integrationTest.zeroUUID,
      },
      headers: {
        ["Content-Type"]: "application/xml",
      },
    },
    422,
  );
  await integrationTest.assertUnsuccessfulResult(
    c,
    invoker,
    {
      method: "POST",
      url: "/api/thing",
      body: {
        invalid_property: integrationTest.zeroUUID,
      },
    },
    422,
  );
  await integrationTest.assertUnsuccessfulResult(
    c,
    invoker,
    {
      method: "GET",
      url: "/api/thing",
      query: {
        includeDeleted: "dummy",
      },
    },
    // TODO is 400 really a good thing at this point?
    400,
  );
  await integrationTest.assertUnsuccessfulResult(
    c,
    invoker,
    {
      method: "GET",
      url: "/api/thing/invalid-uuid",
    },
    // TODO is 400 really a good thing at this point?
    400,
  );
};

const expectedEvents = (
  errors: [unknown, unknown, unknown],
): Array<events.LoggedEvents> => [
  {
    eventName: "onInvalidUrl",
    eventData: {
      state: {},
    },
  },
  {
    eventName: "onInvalidMethod",
    eventData: {
      groups: {
        e_0: "/api/thing",
        e_0_api_0: "/thing",
        e_0_api_0_thing_0: "",
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2: undefined,
        e_0_api_0_thing_2_id: undefined,
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: undefined,
      },
      state: {},
    },
  },
  {
    eventName: "onInvalidContentType",
    eventData: {
      groups: {
        e_0: "/api/thing",
        e_0_api_0: "/thing",
        e_0_api_0_thing_0: "",
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2: undefined,
        e_0_api_0_thing_2_id: undefined,
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: undefined,
      },
      state: {},
      contentType: "application/xml",
    },
  },
  {
    eventName: "onInvalidBody",
    eventData: {
      groups: {
        e_0: "/api/thing",
        e_0_api_0: "/thing",
        e_0_api_0_thing_0: "",
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2: undefined,
        e_0_api_0_thing_2_id: undefined,
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: undefined,
      },
      state: {},
      validationError: {
        error: "error",
        errorInfo: errors[0],
      },
    },
  },
  {
    eventName: "onInvalidQuery",
    eventData: {
      groups: {
        e_0: "/api/thing",
        e_0_api_0: "/thing",
        e_0_api_0_thing_0: "",
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2: undefined,
        e_0_api_0_thing_2_id: undefined,
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: undefined,
      },
      state: {},
      validationError: {
        error: "error",
        errorInfo: errors[1],
      },
    },
  },
  {
    eventData: {
      groups: {
        e_0: "/api/thing/invalid-uuid",
        e_0_api_0: "/thing/invalid-uuid",
        e_0_api_0_thing_0: undefined,
        e_0_api_0_thing_1: "/invalid-uuid",
        e_0_api_0_thing_1_id: "invalid-uuid",
        e_0_api_0_thing_2: undefined,
        e_0_api_0_thing_2_id: undefined,
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: undefined,
      },
      state: {},
      validationError: {
        error: "error",
        errorInfo: errors[2],
      },
    },
    eventName: "onInvalidUrlParameters",
  },
];

// Error order:
// 0. Error for invalid request body
// 1. Error for invalid query data
// 2. Error for invalid URL parameter
const errorsForDataValidationFrameworks: Record<
  integrationTest.SupportedBackendDataValidators,
  Parameters<typeof expectedEvents>[0]
> = {
  "io-ts": [
    [
      {
        context: [
          {
            actual: {
              invalid_property: "00000000-0000-0000-0000-000000000000",
            },
            key: "",
            type: {
              _tag: "InterfaceType",
              name: "{ property: ID }",
              props: {
                property: {
                  _tag: "RefinementType",
                  name: "ID",
                  type: {
                    _tag: "StringType",
                    name: "string",
                  },
                },
              },
            },
          },
          {
            actual: undefined,
            key: "property",
            type: {
              _tag: "RefinementType",
              name: "ID",
              type: {
                _tag: "StringType",
                name: "string",
              },
            },
          },
        ],
        message: undefined,
        value: undefined,
      },
    ],
    [
      {
        error: "error",
        errorInfo: [
          {
            context: [
              {
                actual: "dummy",
                key: "",
                type: {
                  _tag: "KeyofType",
                  keys: {
                    false: "",
                    true: "",
                  },
                  name: '"true" | "false"',
                },
              },
            ],
            message: undefined,
            value: "dummy",
          },
        ],
      },
    ],
    [
      {
        error: "error",
        errorInfo: [
          {
            context: [
              {
                actual: "invalid-uuid",
                key: "",
                type: {
                  _tag: "RefinementType",
                  name: "ID",
                  type: {
                    _tag: "StringType",
                    name: "string",
                  },
                },
              },
            ],
            message: undefined,
            value: "invalid-uuid",
          },
        ],
      },
    ],
  ],
  runtypes: [
    [
      {
        code: "CONTENT_INCORRECT",
        details: {
          property: "Expected string, but was missing",
        },
        message: "Expected { property: string; }, but was incompatible",
      },
    ],
    [
      {
        error: "error",
        errorInfo: [
          {
            code: "TYPE_INCORRECT",
            message: 'Expected "true" | "false", but was string',
          },
        ],
      },
    ],
    [
      {
        error: "error",
        errorInfo: [
          {
            code: "CONSTRAINT_FAILED",
            message:
              "Failed constraint check for string: The IDs must be in valid format.",
          },
        ],
      },
    ],
  ],
  zod: [
    [
      {
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            message: "Required",
            path: ["property"],
            received: "undefined",
          },
        ],
        name: "ZodError",
      },
    ],
    [
      {
        error: "error",
        errorInfo: [
          {
            issues: [
              {
                code: "invalid_union",
                message: "Invalid input",
                path: [],
                unionErrors: [
                  {
                    issues: [
                      {
                        code: "invalid_literal",
                        expected: "true",
                        message: 'Invalid literal value, expected "true"',
                        path: [],
                      },
                    ],
                    name: "ZodError",
                  },
                  {
                    issues: [
                      {
                        code: "invalid_literal",
                        expected: "false",
                        message: 'Invalid literal value, expected "false"',
                        path: [],
                      },
                    ],
                    name: "ZodError",
                  },
                ],
              },
            ],
            name: "ZodError",
          },
        ],
      },
    ],
    [
      {
        error: "error",
        errorInfo: [
          {
            issues: [
              {
                code: "custom",
                message: "The IDs must be in valid UUID format.",
                path: [],
              },
            ],
            name: "ZodError",
          },
        ],
      },
    ],
  ],
};
