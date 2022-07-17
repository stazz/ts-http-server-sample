// This is less of a unit test and more of a integration test
// But let's run this with AVA nevertheless.
import test, { ExecutionContext } from "ava";
import type * as serverModuleApi from "../module-api/server";
import type * as restModuleApi from "../module-api/rest";
import * as feCommon from "../api/data-client/common";
import * as protocol from "../protocol";
import * as utils from "../utils";

import * as serverExpress from "../server/express";
import * as backendIoTs from "../backend/io-ts";
import * as frontendIoTs from "../frontend/io-ts/backend";

import * as net from "net";

import * as destroy from "./destroy";
import * as invoke from "./invokeHTTP";

const testInvokingBackend = test.macro(
  async (
    c,
    serverModule: serverModuleApi.ServerModule,
    restModule: restModuleApi.RESTAPISpecificationModule,
    backend: feCommon.GetAPICalls<
      {
        getThings: protocol.APIGetThings;
        getThing: protocol.APIGetThing;
        createThing: protocol.APICreateThing;
        connectThings: protocol.APIConnectThings;
        authenticated: protocol.APIAuthenticated;
      },
      unknown
    >,
  ) => {
    const server = serverModule.createServer(restModule.createEndpoints);
    const destroyServer = destroy.createDestroyCallback(
      server instanceof net.Server ? server : server.server,
    );
    try {
      // Start the server
      await utils.listenAsync(server, port, host);

      // Perform tests on the server
      assertSuccessfulResult(
        c,
        await backend.getThings({
          query: {
            includeDeleted: true,
          },
        }),
        [],
      );
    } finally {
      try {
        // Close the server
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

const host = "127.0.0.1";
const port = 1000;
const invokeHTTPEndpoint = invoke.createCallHTTPEndpoint(host, port);

test(
  "ExpressJS and IO-TS",
  testInvokingBackend,
  serverExpress.default,
  backendIoTs.default,
  frontendIoTs.createBackend(invokeHTTPEndpoint),
);

const assertSuccessfulResult = <TResult>(
  c: ExecutionContext,
  result: feCommon.APICallResult<TResult, unknown>,
  expectedResult: TResult,
) => {
  c.deepEqual(result, {
    error: "none",
    data: expectedResult,
  });
};
