import * as core from "../core";
import * as md from "../metadata";
import * as common from "./common";
import * as state from "./state";
import {
  AppEndpointBuilderForMethods,
  AppEndpointBuilderForMethodsAndBody,
  AppEndpointBuilder,
} from ".";

export class AppEndpointBuilderInitial<
  TContext,
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TAllowedMethods extends core.HttpMethod,
  TMetadataProviders extends Record<
    string,
    // We must use 'any' as 2nd parameter, otherwise we won't be able to use AppEndpointBuilderInitial with specific TMetadataProviders type as parameter to functions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    md.MetadataBuilder<md.HKTArg, any, unknown>
  >,
> {
  public constructor(
    protected readonly _state: state.AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TState,
      TValidationError,
      TMetadataProviders
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithoutBody,
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext, TState>,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithBody,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext, TState>,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods & core.HttpMethodWithoutBody,
    query: core.QueryValidatorSpec<TQuery, TValidationError>,
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext, TState> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods & core.HttpMethodWithBody,
    query: core.QueryValidatorSpec<TQuery, TValidationError>,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext, TState> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TMetadataProviders
  >;
  forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods,
    query?: core.QueryValidatorSpec<TQuery, TValidationError> | undefined,
  ):
    | AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TState,
        TValidationError,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TMetadataProviders
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TState,
        TValidationError,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TMetadataProviders
      > {
    return this._forMethod(method, query);
  }

  private _forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods,
    query?: core.QueryValidatorSpec<TQuery, TValidationError> | undefined,
  ):
    | AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TState,
        TValidationError,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TMetadataProviders
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TState,
        TValidationError,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TMetadataProviders
      > {
    const overlappingMehods = new Set(
      Object.keys(this._state.methods).filter(
        (existingMethod) => existingMethod === method,
      ),
    );
    if (overlappingMehods.size > 0) {
      throw new Error(
        `The methods ${Array.from(overlappingMehods).join(
          ", ",
        )} are already specified`,
      );
    }

    const queryInfo: common.QueryInfo<
      TValidationError,
      common.EndpointHandlerArgsWithQuery<TQuery>
    > = {
      getEndpointArgs: (q) =>
        query
          ? { query: q as TQuery }
          : // Fugly, but has to do for now.
            ({} as common.EndpointHandlerArgsWithQuery<TQuery>),
    };
    if (query) {
      queryInfo.query = query;
    }

    return core.isMethodWithoutBody(method)
      ? new AppEndpointBuilderForMethods(
          this._state,
          new Set([method]),
          queryInfo,
        )
      : new AppEndpointBuilderForMethodsAndBody(
          this._state,
          new Set([method]),
          queryInfo,
        );
  }

  public batchSpec<
    TMethod extends TAllowedMethods & core.HttpMethodWithoutBody,
    TOutput,
    TOutputContentTypes extends Record<string, unknown>,
  >(
    spec: BatchSpecificationWithoutQueryWithoutBody<
      TRefinedContext,
      TState,
      TValidationError,
      TArgsURL,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContentTypes
    >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & core.HttpMethod,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods & core.HttpMethodWithoutBody,
    TQuery,
    TOutput,
    TOutputContentTypes extends Record<string, unknown>,
  >(
    spec: BatchSpecificationWithQueryWithoutBody<
      TRefinedContext,
      TState,
      TValidationError,
      TArgsURL,
      TQuery,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContentTypes
    >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & core.HttpMethod,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods & core.HttpMethodWithBody,
    TInput,
    TInputContentTypes extends Record<string, unknown>,
    TOutput,
    TOutputContentTypes extends Record<string, unknown>,
  >(
    spec: BatchSpecificationWithoutQueryWithBody<
      TRefinedContext,
      TState,
      TValidationError,
      TArgsURL,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContentTypes,
      TInput,
      TInputContentTypes
    >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & core.HttpMethod,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods & core.HttpMethodWithBody,
    TQuery,
    TInput,
    TInputContentTypes extends Record<string, unknown>,
    TOutput,
    TOutputContentTypes extends Record<string, unknown>,
  >(
    spec: BatchSpecificationWithQueryWithBody<
      TRefinedContext,
      TState,
      TValidationError,
      TArgsURL,
      TQuery,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContentTypes,
      TInput,
      TInputContentTypes
    >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & core.HttpMethod,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods,
    TQuery,
    TInput,
    TInputContentTypes extends Record<string, unknown>,
    TOutput,
    TOutputContentTypes extends Record<string, unknown>,
  >(
    spec:
      | BatchSpecificationWithoutQueryWithoutBody<
          TRefinedContext,
          TState,
          TValidationError,
          TArgsURL,
          TMetadataProviders,
          TMethod & core.HttpMethodWithoutBody,
          TOutput,
          TOutputContentTypes
        >
      | BatchSpecificationWithQueryWithoutBody<
          TRefinedContext,
          TState,
          TValidationError,
          TArgsURL,
          TQuery,
          TMetadataProviders,
          TMethod & core.HttpMethodWithoutBody,
          TOutput,
          TOutputContentTypes
        >
      | BatchSpecificationWithoutQueryWithBody<
          TRefinedContext,
          TState,
          TValidationError,
          TArgsURL,
          TMetadataProviders,
          TMethod & core.HttpMethodWithBody,
          TOutput,
          TOutputContentTypes,
          TInput,
          TInputContentTypes
        >
      | BatchSpecificationWithQueryWithBody<
          TRefinedContext,
          TState,
          TValidationError,
          TArgsURL,
          TQuery,
          TMetadataProviders,
          TMethod & core.HttpMethodWithBody,
          TOutput,
          TOutputContentTypes,
          TInput,
          TInputContentTypes
        >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & core.HttpMethod,
    TMetadataProviders
  > {
    const builder = this._forMethod(
      spec.method,
      "query" in spec ? spec.query : undefined,
    );
    return builder instanceof AppEndpointBuilderForMethodsAndBody &&
      "input" in spec
      ? builder.withBody(
          spec.input,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          spec.endpointHandler as any,
          spec.output,
          spec.mdArgs,
        )
      : builder.withoutBody(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          spec.endpointHandler as any,
          spec.output,
          spec.mdArgs,
        );
  }
}

export type BatchSpecificationWithoutQueryWithoutBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, any, unknown>
  >,
  TMethod,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
> = {
  method: TMethod;
} & common.EndpointSpecArgsWithoutBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  TMetadataProviders,
  TOutput,
  TOutputContentTypes
>;

export type BatchSpecificationWithQueryWithoutBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TQueryData,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, any, unknown>
  >,
  TMethod,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
> = {
  method: TMethod;
  query: core.QueryValidatorSpec<TQueryData, TValidationError>;
} & common.EndpointSpecArgsWithoutBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  common.EndpointHandlerArgsWithQuery<TQueryData>,
  TMetadataProviders,
  TOutput,
  TOutputContentTypes
>;

export type BatchSpecificationWithoutQueryWithBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, any, unknown>
  >,
  TMethod,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
  TInput,
  TInputContentTypes extends Record<string, unknown>,
> = {
  method: TMethod;
} & common.EndpointSpecArgsWithBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  TMetadataProviders,
  TOutput,
  TOutputContentTypes,
  TInput,
  TInputContentTypes
>;

export type BatchSpecificationWithQueryWithBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TQueryData,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, any, unknown>
  >,
  TMethod,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
  TInput,
  TInputContentTypes extends Record<string, unknown>,
> = {
  method: TMethod;
  query: core.QueryValidatorSpec<TQueryData, TValidationError>;
} & common.EndpointSpecArgsWithBody<
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  common.EndpointHandlerArgsWithQuery<TQueryData>,
  TMetadataProviders,
  TOutput,
  TOutputContentTypes,
  TInput,
  TInputContentTypes
>;
