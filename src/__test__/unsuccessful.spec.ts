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
  5,
  // Extra test arguments - unused in this case
  () => [undefined],
  // Title for single test
  ({ serverID, dataValidationID }) =>
    `Unsuccessful invocation test for: server "${serverID}", BE data validation "${dataValidationID}".`,
  // Actual test function for single test
  async ({ c, host, port }) => {
    await runTestsForUnsuccessfulResults(
      c,
      invoke.createCallHTTPEndpoint(host, port),
    );
    return expectedEvents;
  },
);

const runTestsForUnsuccessfulResults = async (
  c: ExecutionContext,
  invoker: data.CallHTTPEndpoint,
) => {
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
};

const expectedEvents: Array<events.LoggedEvents> = [
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
];
