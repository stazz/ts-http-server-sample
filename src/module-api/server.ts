import type * as restApi from "./rest";
import type * as net from "net";
import type * as evts from "@data-heaving/common";
import type * as server from "../api/core/server";

export { State } from "./rest";

export interface ServerModule {
  createServer: <TValidationError>(input: {
    createEndpoints: restApi.RESTAPISpecificationModule<TValidationError>["createEndpoints"];
    createEvents?: <TContext>(
      this: void,
      args: {
        getHumanReadableErrorMessage: ReturnType<
          restApi.RESTAPISpecificationModule<TValidationError>["createEndpoints"]
        >["getHumanReadableErrorMessage"];
        getMethodAndUrl: GetMethodAndURL<TContext>;
      },
    ) =>
      | evts.EventEmitter<
          server.VirtualRequestProcessingEvents<
            TContext,
            restApi.State,
            unknown
          >
        >
      | undefined;
  }) => ServerCreationResult;
}

export type ServerCreationResult =
  | net.Server
  | {
      server: net.Server;
      customListen: (port: number, host: string) => Promise<unknown>;
    };
export type GetMethodAndURL<TContext> = (
  this: void,
  context: TContext,
) => { method: string; url: string };
