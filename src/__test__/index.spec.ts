// This is less of a unit test and more of a integration test
// But let's run this with AVA nevertheless.
import test, { ExecutionContext } from "ava";
import type * as serverModuleApi from "../module-api/server";
import type * as restModuleApi from "../module-api/rest";
import * as destroy from "./destroy";
import * as net from "net";
import type * as feCommon from "../api/data-client/common";
import type * as coreProtocol from "../api/core/protocol";

import * as serverExpress from "../server/express";
import * as dataIoTs from "../backend/io-ts";

const testInvokingBackend = test.macro(
  <THKTEncoded extends coreProtocol.HKTEncoded, TValidationError>(
    c: ExecutionContext,
    serverModule: serverModuleApi.ServerModule,
    restModule: restModuleApi.RESTAPISpecificationModule,
    backend: {
      getThings: feCommon.APICall<THKTEncoded, {}, unknown, TValidationError>;
    },
  ) => {
    const server = serverModule.createServer(restModule.createEndpoints);
    const destroyServer = destroy.createDestroyCallback(
      server instanceof net.Server ? server : server.server,
    );
    c.deepEqual("", "");
  },
);

test(
  "ExpressJS and IO-TS",
  testInvokingBackend,
  serverExpress.default,
  dataIoTs.default,
  {
    getThings: () => {
      throw new Error("Dummy");
    },
  },
);
