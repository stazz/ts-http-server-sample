import type * as core from "../api/core/endpoint";
import type * as server from "../api/core/server";
import type * as common from "./common";

export * from "./common";

// Specify API for server and REST spec modules
export interface RESTAPISpecificationModule<TValidationError> {
  createEndpoints: <TContextHKT extends server.HKTContext>(
    getStateFromContext: server.GetStateFromContext<TContextHKT>,
    contextValidatorFactory: server.ContextValidatorFactory<TContextHKT>,
    idRegexParam: RegExp | undefined,
  ) => {
    // The API endpoints that should be served by server.
    api: Array<
      core.AppEndpoint<
        server.HKTContextKind<TContextHKT, common.State>,
        TValidationError,
        Record<string, unknown>
      >
    >;
    getHumanReadableErrorMessage: (
      this: void,
      error: TValidationError,
    ) => string;
  };
}

export type GetContextHKT<
  T extends server.ContextValidatorFactory<server.HKTContext>,
> = T extends server.ContextValidatorFactory<infer TContext> ? TContext : never;
