// This is less of a unit test and more of a integration test
// But let's run this with AVA nevertheless.
import type * as ava from "ava";
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
import * as events from "./events";

export const testEveryCombination = (
  test: ava.TestFn,
  assertionCount: number | undefined,
  performTests: (data: {
    c: ava.ExecutionContext;
    backend: AllAPICalls;
    loggedEvents: Array<events.LoggedEvents>;
    username: string;
    password: string;
    host: string;
    port: number;
  }) => Promise<Array<events.LoggedEvents>>,
) => {
  const macro = test.macro(
    async (
      c,
      serverModule: Promise<{ default: serverModuleApi.ServerModule }>,
      restModule: Promise<{
        default: restModuleApi.RESTAPISpecificationModule;
      }>,
      beModule: Promise<{
        createBackend: <
          THeaders extends Record<"auth", feCommon.HeaderProvider>,
        >(
          invokeHttp: feCommon.CallHTTPEndpoint,
          headers: THeaders,
        ) => AllAPICalls;
      }>,
    ) => {
      // Expect this amount of assertions.
      c.plan(1 + (assertionCount ?? 0));

      // For authenticated endpoint, use basic auth with the following username and pw
      const username = "test_user";
      const password = "test_password";
      // Create server
      const loggedEvents: Array<events.LoggedEvents> = [];
      const server = (await serverModule).default.createServer({
        createEndpoints: (await restModule).default.createEndpoints,
        tryGetUsername: utils.tryGetUsernameFromBasicAuth(username, password),
        createEvents: () =>
          events.saveAllEventsToArray(loggedEvents, {
            onSuccessfulInvocationStart: undefined,
            onSuccessfulInvocationEnd: undefined,
            onInvalidUrl: undefined,
            onInvalidMethod: undefined,
            onInvalidContext: undefined,
            onInvalidUrlParameters: undefined,
            onInvalidQuery: undefined,
            onInvalidContentType: undefined,
            onInvalidBody: undefined,
            onInvalidResponse: undefined,
          }),
      });
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
        {
          auth: () =>
            `Basic ${Buffer.from(`${username}:${password}`).toString(
              "base64",
            )}`,
        },
      );

      let expectedEvents: Array<events.LoggedEvents> | undefined;
      try {
        // Start the server
        await utils.listenAsync(server, host, port);

        expectedEvents = await performTests({
          c,
          backend,
          loggedEvents,
          username,
          password,
          host,
          port,
        });
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

      if (expectedEvents !== undefined) {
        c.deepEqual(loggedEvents, expectedEvents);
      } else {
        throw new Error(`Most likely destroy server callback throwed.`);
      }
    },
  );

  for (const [serverID, server] of Object.entries(allowedServers)) {
    for (const [dataValidationId, dataValidation] of Object.entries(
      allowedDataValidations,
    )) {
      for (const [backendCreatorID, backendCreator] of Object.entries(
        backendCreators,
      )) {
        test(
          `Server: ${serverID}, BE data validation: ${dataValidationId}, FE data validation: ${backendCreatorID}`,
          macro,
          server,
          dataValidation,
          backendCreator,
        );
      }
    }
  }
};

const { allowedServers, allowedDataValidations } =
  utils.loadServersAndDataValidations();
const backendCreators = {
  ["io-ts"]: import("../frontend/io-ts/backend"),
  runtypes: import("../frontend/runtypes/backend"),
  zod: import("../frontend/zod/backend"),
};

export const assertSuccessfulResult = async <
  TEndpointName extends keyof AllAPICalls,
  TOmitProps extends keyof coreProtocol.RuntimeOf<
    AllAPIDefinitions[TEndpointName]["responseBody"]
  > = never,
>(
  c: ava.ExecutionContext,
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

export const zeroUUID = "00000000-0000-0000-0000-000000000000";

export type AllAPIDefinitions = {
  getThings: protocol.APIGetThings;
  getThing: protocol.APIGetThing;
  createThing: protocol.APICreateThing;
  connectThings: protocol.APIConnectThings;
  authenticated: protocol.APIAuthenticated;
};

export type AllAPICalls = feCommon.GetAPICalls<AllAPIDefinitions>;
