// Import generic REST-related things
import type * as core from "../../api/core/core";
import type * as spec from "../../api/core/spec";

// Import plugin for OpenAPI metadata
import type * as openapi from "../../api/metadata/openapi";

// IO-TS as data runtime validator
import type * as t from "io-ts";
// Import plugin for IO-TS
import type * as tPlugin from "../../api/data/io-ts";

export type TMetadataProviders = { openapi: openapi.OpenAPIMetadataBuilder };

export interface AuthenticatedState {
  username: string;
}

export type EndpointArgs = {
  idRegex: RegExp;
  idInBody: t.BrandC<t.StringC, unknown>;
};

export type EndpointWithStateNoURL<
  TState,
  TMethod extends core.HttpMethod,
> = EndpointFull<
  TState,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  TMethod
>;

export type EndpointWithState<
  TState,
  TArgsURL,
  TMethod extends core.HttpMethod,
> = EndpointFull<TState, { url: TArgsURL }, TMethod>;

export type EndpointNoURL<TMethod extends core.HttpMethod> = EndpointFull<
  unknown,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  TMethod
>;

export type Endpoint<TArgsURL, TMethod extends core.HttpMethod> = EndpointFull<
  unknown,
  { url: TArgsURL },
  TMethod
>;
export type EndpointFull<TState, TArgsURL, TMethod extends core.HttpMethod> = <
  TContext,
  TRefinedContext,
>(
  provider: spec.AppEndpointBuilderInitial<
    TContext,
    TRefinedContext,
    TState,
    tPlugin.ValidationError,
    TArgsURL,
    TMethod,
    TMetadataProviders
  >,
  args: EndpointArgs,
) => spec.AppEndpointBuilder<
  TContext,
  TRefinedContext,
  TState,
  tPlugin.ValidationError,
  TArgsURL,
  Omit<core.HttpMethod, TMethod> & core.HttpMethod,
  TMetadataProviders
>;
