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
    MakeEndpointHandlerArgs<TRefinedContext>,
    never,
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
    MakeEndpointHandlerArgs<TRefinedContext>,
    never,
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
    MakeEndpointHandlerArgs<TRefinedContext> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys,
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
    MakeEndpointHandlerArgs<TRefinedContext> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys,
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
        | MakeEndpointHandlerArgs<TRefinedContext>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        string,
        TMetadataProviders
      >
    | stage2.AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TArgsURL,
        TMethods,
        | MakeEndpointHandlerArgs<TRefinedContext>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        string,
        TMetadataProviders
      > {
    const methodInfo = forMethodImpl(this._state.methods, method, query);
    return methodInfo.body === "none"
      ? new stage2.AppEndpointBuilderForMethods(
          this._state,
          methodInfo.methodsSet,
          methodInfo.queryInfo,
        )
      : new stage2.AppEndpointBuilderForMethodsAndBody(
          this._state,
          methodInfo.methodsSet,
          methodInfo.queryInfo,
        );
  }
}

const forMethodImpl = <
  TMethods extends core.HttpMethod,
  TQuery,
  TValidationError,
  TQueryKeys extends string,
>(
  stateMethods: Record<string, unknown>,
  method: TMethods,
  queryValidation:
    | core.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>
    | undefined,
) => {
  const overlappingMehods = new Set(
    Object.keys(stateMethods).filter(
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
    common.EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys
  > = {
    getEndpointArgs: (q) =>
      queryValidation
        ? { query: q as TQuery }
        : // Fugly, but has to do for now.
          ({} as common.EndpointHandlerArgsWithQuery<TQuery>),
  };
  if (queryValidation) {
    queryInfo.query = queryValidation;
  }

  const common = {
    methodsSet: new Set([method]),

    queryInfo,
  };

  return core.isMethodWithoutBody(method)
    ? ({
        body: "none",
        method,
        ...common,
      } as const)
    : ({
        body: "present",
        method: method as core.HttpMethodWithBody,
        ...common,
      } as const);
};

export type MakeEndpointHandlerArgs<TRefinedContext> =
  common.EndpointHandlerArgs<TRefinedContext>;
