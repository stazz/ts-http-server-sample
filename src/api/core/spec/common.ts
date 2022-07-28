import type * as data from "../data-server";
import type * as md from "../metadata";

export interface EndpointHandlerArgs<TContext, TState> {
  context: TContext;
  state: TState;
}

export interface EndpointHandlerArgsWithURL<TDataInURL> {
  url: TDataInURL;
}

export interface EndpointHandlerArgsWithHeaders<THeaderData> {
  headers: THeaderData;
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

export interface HeaderDataInfo<TArgs> {
  headers?: data.HeaderDataValidatorSpec<Record<string, unknown>>;
  getEndpointArgs: (headers: Record<string, unknown>) => TArgs;
}

export type EndpointHandler<TArgs, THandlerResult> = (
  args: TArgs,
) => THandlerResult | Promise<THandlerResult>;
