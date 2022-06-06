import * as core from "../core";

export interface EndpointHandlerArgs<TContext> {
  context: TContext;
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
  query?: core.QueryValidatorSpec<unknown, TValidationError, string>;
  getEndpointArgs: (query: unknown) => TArgs;
}
