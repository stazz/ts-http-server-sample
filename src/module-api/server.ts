import type * as restApi from "./rest";
import type * as net from "net";

export { State } from "./rest";

export interface ServerModule {
  createServer: (
    createEndpoints: restApi.RESTAPISpecificationModule["createEndpoints"],
  ) => ServerCreationResult;
}

export type ServerCreationResult =
  | net.Server
  | {
      server: net.Server;
      customListen: (port: number, host: string) => Promise<unknown>;
    };
