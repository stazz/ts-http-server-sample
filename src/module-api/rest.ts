import type * as core from "../api/core/core";
import type * as server from "../api/core/server";
import type * as logging from "../logging";
import type * as common from "./common";
import type * as evts from "@data-heaving/common";

export * from "./common";

// Specify API for server and REST spec modules
export interface RESTAPISpecificationModule {
  createEndpoints: <TContextHKT extends server.HKTContext>(
    getStateFromContext: server.GetStateFromContext<TContextHKT>,
    contextValidatorFactory: server.ContextValidatorFactory<TContextHKT>,
    idRegexParam: RegExp | undefined,
    getMethodAndUrl: logging.GetMethodAndURL<TContextHKT>,
  ) => {
    // The API endpoints that should be served by server.
    api: Array<
      core.AppEndpoint<
        server.HKTContextKind<TContextHKT, common.State>,
        unknown,
        Record<string, unknown>
      >
    >;
    // The event builder that can be used to further register events.
    events: evts.EventEmitterBuilder<
      server.VirtualRequestProcessingEvents<
        server.HKTContextKind<TContextHKT, common.State>,
        common.State,
        unknown
      >
    >;
  };
}

export type GetContextHKT<
  T extends server.ContextValidatorFactory<server.HKTContext>,
> = T extends server.ContextValidatorFactory<infer TContext> ? TContext : never;
