import * as core from "../core";
import * as md from "../metadata";
import * as common from "./common";
import * as state from "./state";
import * as stage2 from "./stage2";

export class AppEndpointBuilderInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TArgsURL,
  TAllowedMethods extends core.HttpMethod,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  public constructor(
    protected readonly _state: state.AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithoutBody,
  ): stage2.AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext>,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithBody,
  ): stage2.AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext>,
    TMetadataProviders
  >;
  public forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods & core.HttpMethodWithoutBody,
    query: core.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>,
  ): stage2.AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TMetadataProviders
  >;
  public forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods & core.HttpMethodWithBody,
    query: core.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>,
  ): stage2.AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TArgsURL,
    TMethods,
    common.EndpointHandlerArgs<TRefinedContext> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TMetadataProviders
  >;
  forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods,
    query?:
      | core.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>
      | undefined,
  ):
    | stage2.AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TValidationError,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TMetadataProviders
      >
    | stage2.AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext>
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

    const queryInfo: stage2.QueryInfo<
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
      ? new stage2.AppEndpointBuilderForMethods(
          this._state,
          new Set([method]),
          queryInfo,
        )
      : new stage2.AppEndpointBuilderForMethodsAndBody(
          this._state,
          new Set([method]),
          queryInfo,
        );
  }
}
