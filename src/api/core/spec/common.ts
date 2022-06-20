import type * as core from "../core";
import type * as md from "../metadata";

export interface EndpointHandlerArgs<TContext, TState> {
  context: TContext;
  state: TState;
}

export interface EndpointHandlerArgsWithURL<TDataInURL> {
  url: TDataInURL;
}

export interface EndpointHandlerArgsWithQuery<TQuery> {
  query: TQuery;
}

export interface EndpointHandlerArgsWithBody<TBody> {
  body: TBody;
}

export interface QueryInfo<TValidationError, TArgs> {
  query?: core.QueryValidatorSpec<unknown, TValidationError>;
  getEndpointArgs: (query: unknown) => TArgs;
}

export interface EndpointSpecArgsWithoutBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TArgsQuery,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
> {
  endpointHandler: EndpointHandler<
    TArgsURL & TArgsQuery & EndpointHandlerArgs<TRefinedContext, TState>,
    TOutput
  >;
  output: core.DataValidatorResponseOutputSpec<
    TOutput,
    TValidationError,
    TOutputContentTypes
  >;
  mdArgs: {
    [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
      infer TArg,
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      unknown
    >
      ? md.Kind<
          TArg,
          TArgsURL extends EndpointHandlerArgsWithURL<unknown>
            ? { [P in keyof TArgsURL["url"]]: unknown }
            : undefined,
          TArgsQuery extends EndpointHandlerArgsWithQuery<unknown>
            ? { [P in keyof TArgsQuery["query"]]: unknown }
            : undefined,
          undefined,
          { [P in keyof TOutputContentTypes]: TOutput }
        >
      : never;
  };
}

export interface EndpointSpecArgsWithBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TArgsQuery,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
  TInput,
  TInputContentTypes extends Record<string, unknown>,
> {
  endpointHandler: EndpointHandler<
    TArgsURL &
      TArgsQuery &
      EndpointHandlerArgs<TRefinedContext, TState> &
      EndpointHandlerArgsWithBody<TInput>,
    TOutput
  >;
  input: core.DataValidatorRequestInputSpec<
    TInput,
    TValidationError,
    TInputContentTypes
  >;
  output: core.DataValidatorResponseOutputSpec<
    TOutput,
    TValidationError,
    TOutputContentTypes
  >;
  mdArgs: {
    [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
      infer TArg,
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      unknown
    >
      ? md.Kind<
          TArg,
          TArgsURL extends EndpointHandlerArgsWithURL<unknown>
            ? { [P in keyof TArgsURL["url"]]: unknown }
            : undefined,
          TArgsQuery extends EndpointHandlerArgsWithQuery<unknown>
            ? { [P in keyof TArgsQuery["query"]]: unknown }
            : undefined,
          { [P in keyof TInputContentTypes]: TInput },
          { [P in keyof TOutputContentTypes]: TOutput }
        >
      : never;
  };
}

export type EndpointHandler<TArgs, THandlerResult> = (
  args: TArgs,
) => THandlerResult;
