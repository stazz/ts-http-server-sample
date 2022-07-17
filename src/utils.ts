import type * as serverModuleApi from "./module-api/server";
import * as net from "net";

// This function used to be in index.ts, but since it is also used by tests, needed to be moved here.
// If tests include index.ts, it will try to execute its main entrypoint.
// This is exported because it is used in test
export const listenAsync = (
  server: serverModuleApi.ServerCreationResult,
  port: number,
  host: string,
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
