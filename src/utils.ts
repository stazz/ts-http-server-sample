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
    Promise<{ default: restModuleApi.RESTAPISpecificationModule }>
  > = {
    ["io-ts"]: import("./backend/io-ts"),
    runtypes: import("./backend/runtypes"),
    zod: import("./backend/zod"),
  };
  return {
    allowedServers,
    allowedDataValidations,
  };
};

export const tryGetUsernameFromBasicAuth =
  (
    expectedUsername: string,
    expectedPassword: string,
  ): serverModuleApi.TryGetUsername =>
  (getHeader) => {
    const authOrMany = getHeader("authorization") ?? "";
    const auth = Array.isArray(authOrMany) ? authOrMany[0] : authOrMany;
    const scheme = auth.substring(0, 6).toLowerCase();
    let username: string | undefined;
    if (scheme.startsWith("basic ")) {
      try {
        const authData = Buffer.from(
          auth.substring(scheme.length),
          "base64",
        ).toString();
        const idx = authData.indexOf(":");
        if (idx > 0) {
          if (
            authData.substring(0, idx) === expectedUsername &&
            authData.substring(idx + 1) === expectedPassword
          ) {
            username = authData.substring(0, idx);
          }
        }
      } catch {
        // Ignore, will return 403
      }
    }

    return username;
  };
