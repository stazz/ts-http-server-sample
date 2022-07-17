// This is less of a unit test and more of a integration test
// But let's run this with AVA nevertheless.
import test, { ExecutionContext } from "ava";
import getPort from "@ava/get-port";
import type * as serverModuleApi from "../module-api/server";
import type * as restModuleApi from "../module-api/rest";
import * as feCommon from "../api/data-client/common";
import * as data from "../api/core/data";
import * as coreProtocol from "../api/core/protocol";
import type * as protocol from "../protocol";
import * as utils from "../utils";

import * as net from "net";

import * as destroy from "./destroy";
import * as invoke from "./invokeHTTP";

const testInvokingBackend = test.macro(
  async (
    c,
    serverModule: Promise<{ default: serverModuleApi.ServerModule }>,
    restModule: Promise<{ default: restModuleApi.RESTAPISpecificationModule }>,
    beModule: Promise<{
      createBackend: (invokeHttp: feCommon.CallHTTPEndpoint) => AllAPICalls;
    }>,
  ) => {
    // Expect this amount of assertions.
    c.plan(5);

    // Create server
    const server = (await serverModule).default.createServer(
      (await restModule).default.createEndpoints,
    );
    // Create callback to stop server
    const destroyServer = destroy.createDestroyCallback(
      server instanceof net.Server ? server : server.server,
    );
    // AVA runs tests in parallel -> use plugin to get whatever available port
    const host = "127.0.0.1";
    const port = await getPort();

    // Create object used by FE to invoke BE endpoints
    const backend = (await beModule).createBackend(
      invoke.createCallHTTPEndpoint(host, port),
    );

    try {
      // Start the server
      await utils.listenAsync(server, host, port);

      // Perform tests on the server
      await runTestsForSuccessfulResults(c, backend);
    } finally {
      try {
        // Shut down the server
        await destroyServer();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(
          "Failed to destroy server, the test might become stuck...",
        );
      }
    }
  },
);

const { allowedServers, allowedDataValidations } =
  utils.loadServersAndDataValidations();
const backendCreators = {
  ["io-ts"]: import("../frontend/io-ts/backend"),
  runtypes: import("../frontend/runtypes/backend"),
  zod: import("../frontend/zod/backend"),
};
for (const [serverID, server] of Object.entries(allowedServers)) {
  for (const [dataValidationId, dataValidation] of Object.entries(
    allowedDataValidations,
  )) {
    for (const [backendCreatorID, backendCreator] of Object.entries(
      backendCreators,
    )) {
      test(
        `Server: ${serverID}, BE data validation: ${dataValidationId}, FE data validation: ${backendCreatorID}`,
        testInvokingBackend,
        server,
        dataValidation,
        backendCreator,
      );
    }
  }
}

const runTestsForSuccessfulResults = async (
  c: ExecutionContext,
  apiCalls: AllAPICalls,
) => {
  await assertSuccessfulResult(
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

  await assertSuccessfulResult(
    c,
    apiCalls,
    "getThing",
    {
      url: {
        id: zeroUUID,
      },
      query: {},
    },
    zeroUUID,
  );

  await assertSuccessfulResult(
    c,
    apiCalls,
    "createThing",
    {
      body: {
        property: zeroUUID,
      },
    },
    {
      property: zeroUUID,
    },
  );

  await assertSuccessfulResult(
    c,
    apiCalls,
    "connectThings",
    {
      url: {
        id: zeroUUID,
      },
      body: {
        anotherThingId: zeroUUID,
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

  await assertSuccessfulResult(
    c,
    apiCalls,
    "authenticated",
    undefined,
    undefined,
  );
};

const assertSuccessfulResult = async <
  TEndpointName extends keyof AllAPICalls,
  TOmitProps extends keyof coreProtocol.RuntimeOf<
    AllAPIDefinitions[TEndpointName]["responseBody"]
  > = never,
>(
  c: ExecutionContext,
  apiCalls: AllAPICalls,
  endpointName: TEndpointName,
  input: coreProtocol.RuntimeOf<Parameters<AllAPICalls[TEndpointName]>>[0],
  expectedResult: coreProtocol.RuntimeOf<
    AllAPIDefinitions[TEndpointName]["responseBody"]
  >,
  omitProps: Array<TOmitProps> = [],
) => {
  c.like(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    await apiCalls[endpointName](input as any),
    {
      error: "none",
      data:
        // If we always call .omit, we will end up in situation with expectedResult being array and data we pass being object.
        omitProps.length > 0
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
            data.omit(expectedResult, ...(omitProps as Array<any>))
          : expectedResult,
    },
    `Endpoint "${endpointName}" failed.`,
  );
};

const zeroUUID = "00000000-0000-0000-0000-000000000000";

type AllAPIDefinitions = {
  getThings: protocol.APIGetThings;
  getThing: protocol.APIGetThing;
  createThing: protocol.APICreateThing;
  connectThings: protocol.APIConnectThings;
  authenticated: protocol.APIAuthenticated;
};
type AllAPICalls = feCommon.GetAPICalls<AllAPIDefinitions, unknown>;
