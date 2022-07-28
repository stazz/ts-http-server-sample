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
  TInputContents extends data.TInputContentsBase,
  TMetadataProviders extends Record<
    string,
    // We must use 'any' as 2nd parameter, otherwise we won't be able to use AppEndpointBuilderInitial with specific TMetadataProviders type as parameter to functions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    md.MetadataBuilder<md.HKTArg, any, unknown, TOutputContents, TInputContents>
  >,
> {
  public constructor(
    protected readonly _state: state.AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TState,
      TOutputContents,
      TInputContents,
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
    common.EndpointHandlerArgs<TRefinedContext, TState>,
    TOutputContents,
    TInputContents,
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
    common.EndpointHandlerArgs<TRefinedContext, TState>,
    TOutputContents,
    TInputContents,
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
    common.EndpointHandlerArgs<TRefinedContext, TState>,
    common.EndpointHandlerArgs<TRefinedContext, TState> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TOutputContents,
    TInputContents,
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
    common.EndpointHandlerArgs<TRefinedContext, TState>,
    common.EndpointHandlerArgs<TRefinedContext, TState> &
      common.EndpointHandlerArgsWithQuery<TQuery>,
    TOutputContents,
    TInputContents,
    TMetadataProviders
  >;
  forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    THeaderData extends Record<string, unknown>,
  >(
    method: TMethods,
    query?: data.QueryValidatorSpec<TQuery, keyof TQuery & string> | undefined,
    headers?: data.HeaderDataValidatorSpec<THeaderData> | undefined,
  ):
    | AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TState,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithHeaders<THeaderData>,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TOutputContents,
        TInputContents,
        TMetadataProviders
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TState,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithHeaders<THeaderData>,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TOutputContents,
        TInputContents,
        TMetadataProviders
      > {
    return this._forMethod(method, query, headers);
  }

  private _forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    THeaderData extends Record<string, unknown>,
  >(
    method: TMethods,
    query?: data.QueryValidatorSpec<TQuery, keyof TQuery & string> | undefined,
    headers?: data.HeaderDataValidatorSpec<THeaderData> | undefined,
  ):
    | AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TState,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithHeaders<THeaderData>,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TOutputContents,
        TInputContents,
        TMetadataProviders
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TState,
        TArgsURL,
        TMethods,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithHeaders<THeaderData>,
        | common.EndpointHandlerArgs<TRefinedContext, TState>
        | common.EndpointHandlerArgsWithQuery<TQuery>,
        TOutputContents,
        TInputContents,
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

    const headerInfo: common.HeaderDataInfo<
      common.EndpointHandlerArgsWithHeaders<THeaderData>
    > = {
      getEndpointArgs: (h) =>
        headers
          ? { headers: h as THeaderData }
          : ({} as common.EndpointHandlerArgsWithHeaders<THeaderData>),
    };
    if (headers) {
      headerInfo.headers = headers;
    }

    return ep.isMethodWithoutBody(method)
      ? new AppEndpointBuilderForMethods(
          this._state,
          new Set([method]),
          queryInfo,
          headerInfo,
        )
      : new AppEndpointBuilderForMethodsAndBody(
          this._state,
          new Set([method]),
          queryInfo,
          headerInfo,
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
    > & { query: never },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
    TInputContents,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods & ep.HttpMethodWithoutBody,
    TQuery,
    TOutput,
  >(
    spec: BatchSpecificationWithoutQueryWithoutBody<
      TRefinedContext,
      TState,
      TArgsURL & common.EndpointHandlerArgsWithQuery<TQuery>,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContents
    > &
      BatchSpecificationQueryArgs<TQuery>,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
    TInputContents,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods & ep.HttpMethodWithBody,
    TInput,
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
      TInputContents
    > & { query: never },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
    TInputContents,
    TMetadataProviders
  >;
  public batchSpec<
    TMethod extends TAllowedMethods & ep.HttpMethodWithBody,
    TQuery,
    TInput,
    TOutput,
  >(
    spec: BatchSpecificationWithoutQueryWithBody<
      TRefinedContext,
      TState,
      TArgsURL & common.EndpointHandlerArgsWithQuery<TQuery>,
      TMetadataProviders,
      TMethod,
      TOutput,
      TOutputContents,
      TInput,
      TInputContents
    > &
      BatchSpecificationQueryArgs<TQuery>,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
    TInputContents,
    TMetadataProviders
  >;
  public batchSpec<TMethod extends TAllowedMethods, TQuery, TInput, TOutput>(
    spec: (
      | BatchSpecificationWithoutQueryWithoutBody<
          TRefinedContext,
          TState,
          // TODO figure out non-any type which would not cause signature mismatch
          any,
          TMetadataProviders,
          TMethod & ep.HttpMethodWithoutBody,
          TOutput,
          TOutputContents
        >
      | BatchSpecificationWithoutQueryWithBody<
          TRefinedContext,
          TState,
          // TODO figure out non-any type which would not cause signature mismatch
          any,
          TMetadataProviders,
          TMethod & ep.HttpMethodWithBody,
          TOutput,
          TOutputContents,
          TInput,
          TInputContents
        >
    ) &
      // eslint-disable-next-line @typescript-eslint/ban-types
      ({} | BatchSpecificationQueryArgs<TQuery>),
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Omit<TAllowedMethods, TMethod> & ep.HttpMethod,
    TOutputContents,
    TInputContents,
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
          spec.endpointHandler,
          spec.output,
          spec.mdArgs,
        )
      : builder.withoutBody(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          spec.endpointHandler,
          spec.output,
          spec.mdArgs,
        );
  }
}

export type BatchSpecificationWithoutQueryWithoutBody<
  TRefinedContext,
  TState,
  TEndpointArgs,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, any, unknown, TOutputContentTypes, never>
  >,
  TMethod,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
> = {
  method: TMethod;
} & EndpointSpecArgsWithoutBody<
  TRefinedContext,
  TState,
  TEndpointArgs,
  TMetadataProviders,
  TOutput,
  TOutputContentTypes
>;

// export type BatchSpecificationWithQueryWithoutBody<
//   TRefinedContext,
//   TState,
//   TArgsURL,
//   TQueryData,
//   TMetadataProviders extends Record<
//     string,
//     md.MetadataBuilder<md.HKTArg, any, unknown, TOutputContentTypes, never>
//   >,
//   TMethod,
//   TOutput,
//   TOutputContentTypes extends Record<string, unknown>,
// > = {
//   method: TMethod;
//   query: data.QueryValidatorSpec<TQueryData, keyof TQueryData & string>;
// } & common.EndpointSpecArgsWithoutBody<
//   TRefinedContext,
//   TState,
//   TArgsURL,
//   common.EndpointHandlerArgsWithQuery<TQueryData>,
//   TMetadataProviders,
//   TOutput,
//   TOutputContentTypes
// >;

export type BatchSpecificationWithoutQueryWithBody<
  TRefinedContext,
  TState,
  TEndpointArgs,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<
      md.HKTArg,
      any,
      unknown,
      TOutputContentTypes,
      TInputContentTypes
    >
  >,
  TMethod,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
  TInput,
  TInputContentTypes extends Record<string, unknown>,
> = {
  method: TMethod;
} & EndpointSpecArgsWithBody<
  TRefinedContext,
  TState,
  TEndpointArgs,
  TMetadataProviders,
  TOutput,
  TOutputContentTypes,
  TInput,
  TInputContentTypes
>;

// export type BatchSpecificationWithQueryWithBody<
//   TRefinedContext,
//   TState,
//   TArgsURL,
//   TQueryData,
//   TMetadataProviders extends Record<
//     string,
//     md.MetadataBuilder<
//       md.HKTArg,
//       any,
//       unknown,
//       TOutputContentTypes,
//       TInputContentTypes
//     >
//   >,
//   TMethod,
//   TOutput,
//   TOutputContentTypes extends Record<string, unknown>,
//   TInput,
//   TInputContentTypes extends Record<string, unknown>,
// > = {
//   method: TMethod;
//   query: data.QueryValidatorSpec<TQueryData, keyof TQueryData & string>;
// } & common.EndpointSpecArgsWithBody<
//   TRefinedContext,
//   TState,
//   TArgsURL,
//   common.EndpointHandlerArgsWithQuery<TQueryData>,
//   TMetadataProviders,
//   TOutput,
//   TOutputContentTypes,
//   TInput,
//   TInputContentTypes
// >;

export interface BatchSpecificationQueryArgs<TQuery> {
  query: data.QueryValidatorSpec<TQuery, keyof TQuery & string>;
}

export interface EndpointSpecArgsWithoutBody<
  TRefinedContext,
  TState,
  TEndpointArgs,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown, TOutputContentTypes, never>
  >,
  TOutput,
  TOutputContentTypes extends Record<string, unknown>,
> {
  endpointHandler: common.EndpointHandler<
    TEndpointArgs & common.EndpointHandlerArgs<TRefinedContext, TState>,
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
          TEndpointArgs extends common.EndpointHandlerArgsWithURL<unknown>
            ? { [P in keyof TEndpointArgs["url"]]: unknown }
            : undefined,
          TEndpointArgs extends common.EndpointHandlerArgsWithQuery<unknown>
            ? { [P in keyof TEndpointArgs["query"]]: unknown }
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
  TEndpointArgs,
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
  endpointHandler: common.EndpointHandler<
    TEndpointArgs &
      common.EndpointHandlerArgs<TRefinedContext, TState> &
      common.EndpointHandlerArgsWithBody<TInput>,
    // TArgsURL &
    //   TArgsQuery &
    //   common.EndpointHandlerArgs<TRefinedContext, TState> &
    //   common.EndpointHandlerArgsWithBody<TInput>,
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
          TEndpointArgs extends common.EndpointHandlerArgsWithURL<unknown>
            ? { [P in keyof TEndpointArgs["url"]]: unknown }
            : undefined,
          TEndpointArgs extends common.EndpointHandlerArgsWithQuery<unknown>
            ? { [P in keyof TEndpointArgs["query"]]: unknown }
            : undefined,
          { [P in keyof TInputContentTypes]: TInput },
          { [P in keyof TOutputContentTypes]: TOutput }
        >
      : never;
  };
}
