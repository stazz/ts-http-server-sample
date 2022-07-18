import type * as serverModuleApi from "./module-api/server";
import type * as restModuleApi from "./module-api/rest";
import * as net from "net";

// These functions used to be in index.ts, but since it is also used by tests, needed to be moved here.
// If tests include index.ts, it will try to execute its main entrypoint.
// This is exported because it is used in test

export const listenAsync = (
  server: serverModuleApi.ServerCreationResult,
  host: string,
  port: number,
) =>
  server instanceof net.Server
    ? new Promise<void>((resolve, reject) => {
        try {
          server.listen(port, host, () => resolve());
        } catch (e) {
          reject(e);
        }
      })
    : server.customListen(port, host);

export const loadServersAndDataValidations = () => {
  const allowedServers: Record<
    string,
    Promise<{ default: serverModuleApi.ServerModule }>
  > = {
    express: import("./server/express"),
    fastify: import("./server/fastify"),
    koa: import("./server/koa"),
  };

  const allowedDataValidations: Record<
    string,
    Promise<{ default: restModuleApi.RESTAPISpecificationModule<unknown> }>
  > = {
    ["io-ts"]: import("./backend/io-ts") as Promise<{
      default: restModuleApi.RESTAPISpecificationModule<unknown>;
    }>,
    runtypes: import("./backend/runtypes") as Promise<{
      default: restModuleApi.RESTAPISpecificationModule<unknown>;
    }>,
    zod: import("./backend/zod") as Promise<{
      default: restModuleApi.RESTAPISpecificationModule<unknown>;
    }>,
  };
  return {
    allowedServers,
    allowedDataValidations,
  };
};
