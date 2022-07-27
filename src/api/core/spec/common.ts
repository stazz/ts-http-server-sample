import type * as data from "../data-server";
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

export interface QueryInfo<TArgs> {
  query?: data.QueryValidatorSpec<unknown, string>;
  getEndpointArgs: (query: unknown) => TArgs;
}

export interface EndpointSpecArgsWithoutBody<
  TRefinedContext,
  TState,
  TArgsURL,
  TArgsQuery,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown, TOutputContentTypes, never>
  >,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
> {
  endpointHandler: EndpointHandler<
    TArgsURL & TArgsQuery & EndpointHandlerArgs<TRefinedContext, TState>,
    TOutput
  >;
  output: data.DataValidatorResponseOutputSpec<TOutput, TOutputContentTypes>;
  mdArgs: {
    [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
      infer TArg,
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      unknown,
      TOutputContentTypes,
      never
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
  TArgsURL,
  TArgsQuery,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<
      md.HKTArg,
      unknown,
      unknown,
      TOutputContentTypes,
      TInputContentTypes
    >
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
  input: data.DataValidatorRequestInputSpec<TInput, TInputContentTypes>;
  output: data.DataValidatorResponseOutputSpec<TOutput, TOutputContentTypes>;
  mdArgs: {
    [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
      infer TArg,
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      unknown,
      TOutputContentTypes,
      TInputContentTypes
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
