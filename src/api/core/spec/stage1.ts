import * as ep from "../endpoint";
import type * as data from "../data-server";
import type * as md from "../metadata";
import type * as common from "./common";
import type * as state from "./state";
import {
  AppEndpointBuilderForMethods,
  AppEndpointBuilderForMethodsAndBody,
  AppEndpointBuilder,
} from ".";

export class AppEndpointBuilderInitial<
  TContext,
  TRefinedContext,
  TState,
  TArgsURL,
  TAllowedMethods extends ep.HttpMethod,
  TOutputContents extends data.TOutputContentsBase,
  TMetadataProviders extends Record<
    string,
    // We must use 'any' as 2nd parameter, otherwise we won't be able to use AppEndpointBuilderInitial with specific TMetadataProviders type as parameter to functions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    md.MetadataBuilder<md.HKTArg, any, unknown, TOutputContents>
  >,
> {
  public constructor(
    protected readonly _state: state.AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TState,
      TOutputContents,
      TMetadataProviders
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & ep.HttpMethodWithoutBody,
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext, TState>,
    TOutputContents,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & ep.HttpMethodWithBody,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext, TState>,
    TOutputContents,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods & ep.HttpMethodWithoutBody,
    query: data.QueryValidatorSpec<TQuery, keyof TQuery & string>,
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext, TState> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TOutputContents,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods & ep.HttpMethodWithBody,
    query: data.QueryValidatorSpec<TQuery, keyof TQuery & string>,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext, TState> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TOutputContents,
    TMetadataProviders
  >;
  forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods,
    query?: data.QueryValidatorSpec<TQuery, keyof TQuery & string> | undefined,
  ):
    | AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TState,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TOutputContents,
        TMetadataProviders
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TState,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TOutputContents,
        TMetadataProviders
      > {
    return this._forMethod(method, query);
  }

  private _forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods,
    query?: data.QueryValidatorSpec<TQuery, keyof TQuery & string> | undefined,
  ):
    | AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TState,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TOutputContents,
        TMetadataProviders
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TState,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TOutputContents,
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

    return ep.isMethodWithoutBody(method)
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
    TMethod extends TAllowedMethods & ep.HttpMethodWithoutBody,
    TOutput,
  >(
    spec: BatchSpecificationWithoutQueryWithoutBody<
      TRefinedContext,
      TState,
      TArgsURL,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContents
    >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods & ep.HttpMethodWithoutBody,
    TQuery,
    TOutput,
  >(
    spec: BatchSpecificationWithQueryWithoutBody<
      TRefinedContext,
      TState,
      TArgsURL,
      TQuery,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContents
    >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods & ep.HttpMethodWithBody,
    TInput,
    TInputContentTypes extends Record<string, unknown>,
    TOutput,
  >(
    spec: BatchSpecificationWithoutQueryWithBody<
      TRefinedContext,
      TState,
      TArgsURL,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContents,
      TInput,
      TInputContentTypes
    >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods & ep.HttpMethodWithBody,
    TQuery,
    TInput,
    TInputContentTypes extends Record<string, unknown>,
    TOutput,
  >(
    spec: BatchSpecificationWithQueryWithBody<
      TRefinedContext,
      TState,
      TArgsURL,
      TQuery,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContents,
      TInput,
      TInputContentTypes
    >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods,
    TQuery,
    TInput,
    TInputContentTypes extends Record<string, unknown>,
    TOutput,
  >(
    spec:
      | BatchSpecificationWithoutQueryWithoutBody<
          TRefinedContext,
          TState,
          TArgsURL,
          TMetadataProviders,
          TMethod & ep.HttpMethodWithoutBody,
          TOutput,
          TOutputContents
        >
      | BatchSpecificationWithQueryWithoutBody<
          TRefinedContext,
          TState,
          TArgsURL,
          TQuery,
          TMetadataProviders,
          TMethod & ep.HttpMethodWithoutBody,
          TOutput,
          TOutputContents
        >
      | BatchSpecificationWithoutQueryWithBody<
          TRefinedContext,
          TState,
          TArgsURL,
          TMetadataProviders,
          TMethod & ep.HttpMethodWithBody,
          TOutput,
          TOutputContents,
          TInput,
          TInputContentTypes
        >
      | BatchSpecificationWithQueryWithBody<
          TRefinedContext,
          TState,
          TArgsURL,
          TQuery,
          TMetadataProviders,
          TMethod & ep.HttpMethodWithBody,
          TOutput,
          TOutputContents,
          TInput,
          TInputContentTypes
        >,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
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
  TArgsURL,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, any, unknown, TOutputContentTypes>
  >,
  TMethod,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
> = {
  method: TMethod;
} & common.EndpointSpecArgsWithoutBody<
  TRefinedContext,
  TState,
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
  TArgsURL,
  TQueryData,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, any, unknown, TOutputContentTypes>
  >,
  TMethod,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
> = {
  method: TMethod;
  query: data.QueryValidatorSpec<TQueryData, keyof TQueryData & string>;
} & common.EndpointSpecArgsWithoutBody<
  TRefinedContext,
  TState,
  TArgsURL,
  common.EndpointHandlerArgsWithQuery<TQueryData>,
  TMetadataProviders,
  TOutput,
  TOutputContentTypes
>;

export type BatchSpecificationWithoutQueryWithBody<
  TRefinedContext,
  TState,
  TArgsURL,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, any, unknown, TOutputContentTypes>
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
  TArgsURL,
  TQueryData,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, any, unknown, TOutputContentTypes>
  >,
  TMethod,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
  TInput,
  TInputContentTypes extends Record<string, unknown>,
> = {
  method: TMethod;
  query: data.QueryValidatorSpec<TQueryData, keyof TQueryData & string>;
} & common.EndpointSpecArgsWithBody<
  TRefinedContext,
  TState,
  TArgsURL,
  common.EndpointHandlerArgsWithQuery<TQueryData>,
  TMetadataProviders,
  TOutput,
  TOutputContentTypes,
  TInput,
  TInputContentTypes
>;
