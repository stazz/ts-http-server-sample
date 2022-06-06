import * as core from "../core";
import * as md from "../metadata";
import * as state from "./state";
import * as stage2 from "./stage2";

export class AppEndpointBuilderInitial<
  TContext,
  TRefinedContext,
  TValidationError,
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
    TMethods,
    stage2.EndpointHandlerArgs<TRefinedContext>,
    never,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithBody,
  ): stage2.AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    stage2.EndpointHandlerArgs<TRefinedContext>,
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
    TMethods,
    stage2.EndpointHandlerArgs<TRefinedContext> &
      stage2.EndpointHandlerArgsWithQuery<TQuery>,
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
    TMethods,
    stage2.EndpointHandlerArgs<TRefinedContext> &
      stage2.EndpointHandlerArgsWithQuery<TQuery>,
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
        TMethods,
        | stage2.EndpointHandlerArgs<TRefinedContext>
        | stage2.EndpointHandlerArgsWithQuery<TQuery>,
        string,
        TMetadataProviders
      >
    | stage2.AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TMethods,
        | stage2.EndpointHandlerArgs<TRefinedContext>
        | stage2.EndpointHandlerArgsWithQuery<TQuery>,
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

export class AppEndpointBuilderWithURLDataInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends core.HttpMethod,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  public constructor(
    protected readonly _state: state.AppEndpointBuilderWithURLDataState<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithoutBody,
  ): stage2.AppEndpointBuilderForURLDataAndMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    stage2.EndpointHandlerArgs<TRefinedContext>,
    never,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithBody,
  ): stage2.AppEndpointBuilderForURLDataAndMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    stage2.EndpointHandlerArgs<TRefinedContext>,
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
  ): stage2.AppEndpointBuilderForURLDataAndMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    stage2.EndpointHandlerArgs<TRefinedContext> &
      stage2.EndpointHandlerArgsWithQuery<TQuery>,
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
  ): stage2.AppEndpointBuilderForURLDataAndMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    stage2.EndpointHandlerArgs<TRefinedContext> &
      stage2.EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys,
    TMetadataProviders
  >;
  forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods,
    query?: core.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>,
  ):
    | stage2.AppEndpointBuilderForURLDataAndMethods<
        TContext,
        TRefinedContext,
        TValidationError,
        TDataInURL,
        TMethods,
        | stage2.EndpointHandlerArgs<TRefinedContext>
        | stage2.EndpointHandlerArgsWithQuery<TQuery>,
        string,
        TMetadataProviders
      >
    | stage2.AppEndpointBuilderForURLDataAndMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TDataInURL,
        TMethods,
        | stage2.EndpointHandlerArgs<TRefinedContext>
        | stage2.EndpointHandlerArgsWithQuery<TQuery>,
        string,
        TMetadataProviders
      > {
    const methodInfo = forMethodImpl(this._state.methods, method, query);
    return methodInfo.body === "none"
      ? new stage2.AppEndpointBuilderForURLDataAndMethods(
          this._state,
          methodInfo.methodsSet,
          methodInfo.queryInfo,
        )
      : new stage2.AppEndpointBuilderForURLDataAndMethodsAndBody(
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
    stage2.EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys
  > = {
    getEndpointArgs: (q) =>
      queryValidation
        ? { query: q as TQuery }
        : // Fugly, but has to do for now.
          ({} as stage2.EndpointHandlerArgsWithQuery<TQuery>),
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
