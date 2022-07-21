// This is less of a unit test and more of a integration test
// But let's run this with AVA nevertheless.
import test, { ExecutionContext } from "ava";
import * as integrationTest from "./integration-test";
import type * as events from "./events";

integrationTest.testEveryCombination(
  // AVA runtime
  test,
  // Expected amount of assertions by the actual test function
  5,
  // Actual test function
  async ({ c, backend }) => {
    await runTestsForSuccessfulResults(c, backend);
    return expectedEvents;
  },
);

const runTestsForSuccessfulResults = async (
  c: ExecutionContext,
  apiCalls: integrationTest.AllAPICalls,
) => {
  await integrationTest.assertSuccessfulResult(
    c,
    apiCalls,
    "getThings",
    {
      query: {
        includeDeleted: true,
      },
    },
    [],
  );

  await integrationTest.assertSuccessfulResult(
    c,
    apiCalls,
    "getThing",
    {
      url: {
        id: integrationTest.zeroUUID,
      },
      query: {},
    },
    integrationTest.zeroUUID,
  );

  await integrationTest.assertSuccessfulResult(
    c,
    apiCalls,
    "createThing",
    {
      body: {
        property: integrationTest.zeroUUID,
      },
    },
    {
      property: integrationTest.zeroUUID,
    },
  );

  await integrationTest.assertSuccessfulResult(
    c,
    apiCalls,
    "connectThings",
    {
      url: {
        id: integrationTest.zeroUUID,
      },
      body: {
        anotherThingId: integrationTest.zeroUUID,
      },
    },
    {
      connected: true,
      connectedAt: new Date(),
    },
    // TODO Would be nice if Ava would allow custom equality comparison callbacks so we could do instanceof check instead of this.
    // Alternatively, expose CONNECTED_AT property in src/lib folder and make that be returned from function there.
    ["connectedAt"],
  );

  await integrationTest.assertSuccessfulResult(
    c,
    apiCalls,
    "authenticated",
    undefined,
    undefined,
  );
};

const expectedEvents: Array<events.LoggedEvents> = [
  {
    eventName: "onSuccessfulInvocationStart",
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
    eventName: "onSuccessfulInvocationEnd",
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
    eventName: "onSuccessfulInvocationStart",
    eventData: {
      groups: {
        e_0: "/api/thing/00000000-0000-0000-0000-000000000000",
        e_0_api_0: "/thing/00000000-0000-0000-0000-000000000000",
        e_0_api_0_thing_0: undefined,
        e_0_api_0_thing_1: "/00000000-0000-0000-0000-000000000000",
        e_0_api_0_thing_1_id: "00000000-0000-0000-0000-000000000000",
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
    eventName: "onSuccessfulInvocationEnd",
    eventData: {
      groups: {
        e_0: "/api/thing/00000000-0000-0000-0000-000000000000",
        e_0_api_0: "/thing/00000000-0000-0000-0000-000000000000",
        e_0_api_0_thing_0: undefined,
        e_0_api_0_thing_1: "/00000000-0000-0000-0000-000000000000",
        e_0_api_0_thing_1_id: "00000000-0000-0000-0000-000000000000",
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
    eventName: "onSuccessfulInvocationStart",
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
    eventName: "onSuccessfulInvocationEnd",
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
    eventName: "onSuccessfulInvocationStart",
    eventData: {
      groups: {
        e_0: "/api/thing/00000000-0000-0000-0000-000000000000/connectToAnotherThing",
        e_0_api_0:
          "/thing/00000000-0000-0000-0000-000000000000/connectToAnotherThing",
        e_0_api_0_thing_0: undefined,
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2:
          "/00000000-0000-0000-0000-000000000000/connectToAnotherThing",
        e_0_api_0_thing_2_id: "00000000-0000-0000-0000-000000000000",
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: undefined,
      },
      state: {},
    },
  },
  {
    eventName: "onSuccessfulInvocationEnd",
    eventData: {
      groups: {
        e_0: "/api/thing/00000000-0000-0000-0000-000000000000/connectToAnotherThing",
        e_0_api_0:
          "/thing/00000000-0000-0000-0000-000000000000/connectToAnotherThing",
        e_0_api_0_thing_0: undefined,
        e_0_api_0_thing_1: undefined,
        e_0_api_0_thing_1_id: undefined,
        e_0_api_0_thing_2:
          "/00000000-0000-0000-0000-000000000000/connectToAnotherThing",
        e_0_api_0_thing_2_id: "00000000-0000-0000-0000-000000000000",
        e_1: undefined,
        e_1_api_0: undefined,
        e_2: undefined,
      },
      state: {},
    },
  },
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
        e_1: "/api/secret",
        e_1_api_0: "/secret",
        e_2: undefined,
      },
      state: {
        username: "test_user",
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
        e_1: "/api/secret",
        e_1_api_0: "/secret",
        e_2: undefined,
      },
      state: {
        username: "test_user",
      },
    },
  },
];
