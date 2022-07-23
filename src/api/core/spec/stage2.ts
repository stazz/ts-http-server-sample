import * as ep from "../endpoint";
import type * as data from "../data-server";
import type * as md from "../metadata";
import type * as common from "./common";
import type * as state from "./state";
import { AppEndpointBuilder } from ".";

export class AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TState,
  TArgsURL,
  TAllowedMethods extends ep.HttpMethod,
  TArgsQuery,
  TOutputContents extends data.TOutputContentsBase,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown, TOutputContents>
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
    protected readonly _methods: Set<TAllowedMethods>,
    protected readonly _queryInfo: common.QueryInfo<TArgsQuery>,
  ) {}

  public withoutBody<TOutput>(
    endpointHandler: common.EndpointHandler<
      TArgsURL &
        TArgsQuery &
        common.EndpointHandlerArgs<TRefinedContext, TState>,
      TOutput
    >,
    {
      validator,
      ...outputSpec
    }: data.DataValidatorResponseOutputSpec<TOutput, TOutputContents>,
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
        infer TArg,
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        unknown,
        infer _1
      >
        ? md.Kind<
            TArg,
            TArgsURL extends common.EndpointHandlerArgsWithURL<unknown>
              ? { [P in keyof TArgsURL["url"]]: unknown }
              : undefined,
            TArgsQuery extends common.EndpointHandlerArgsWithQuery<unknown>
              ? { [P in keyof TArgsQuery["query"]]: unknown }
              : undefined,
            undefined,
            { [P in keyof TOutputContents]: TOutput }
          >
        : never;
    },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Exclude<ep.HttpMethod, TAllowedMethods>,
    TOutputContents,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { contextTransform, urlValidation } = this._state;
    const handler: state.StaticAppEndpointBuilderSpec<
      TContext,
      TOutputContents,
      TMetadataProviders
    > = {
      outputValidation: outputSpec,
      builder: (groupNamePrefix) => {
        const retVal: ep.StaticAppEndpointHandler<TContext> = {
          // TODO use runtime pick props for contextValidator!
          contextValidator:
            contextTransform as ep.StaticAppEndpointHandler<TContext>["contextValidator"],
          urlValidator: urlValidation
            ? Object.fromEntries(
                Object.entries(urlValidation.validation).map(
                  ([parameterName, { validator }]) => [
                    // Final group name
                    `${groupNamePrefix}${parameterName}`,
                    // URL parameter validation
                    {
                      parameterName,
                      validator,
                    },
                  ],
                ),
              )
            : undefined,
          queryValidator: query?.validator,
          handler: ({ context, state, url, query }) => {
            const handlerArgs = {
              ...getEndpointArgs(query),
              context,
              state,
            };
            if (urlValidation) {
              (
                handlerArgs as unknown as common.EndpointHandlerArgsWithURL<unknown>
              ).url = url;
            }
            return validator(
              endpointHandler(
                handlerArgs as unknown as Parameters<typeof endpointHandler>[0],
              ),
            );
          },
        };

        return retVal;
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      mdArgs: mdArgs as any,
    };
    if (query) {
      handler.queryValidation = ep.omit(query, "validator");
    }
    return new AppEndpointBuilder({
      ...this._state,
      methods: Object.assign(
        {},
        Object.fromEntries(
          Array.from(this._methods.values()).map((method) => [method, handler]),
        ),
        this._state.methods,
      ),
    });
  }
}

export class AppEndpointBuilderForMethodsAndBody<
  TContext,
  TRefinedContext,
  TState,
  TArgsURL,
  TAllowedMethods extends ep.HttpMethod,
  TArgsQuery,
  TOutputContents extends data.TOutputContentsBase,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown, TOutputContents>
  >,
> extends AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TState,
  TArgsURL,
  TAllowedMethods,
  TArgsQuery,
  TOutputContents,
  TMetadataProviders
> {
  public withBody<
    THandlerResult,
    TBody,
    TInputContentTypes extends Record<string, unknown>,
  >(
    {
      validator: inputValidator,
      ...inputSpec
    }: data.DataValidatorRequestInputSpec<TBody, TInputContentTypes>,
    endpointHandler: common.EndpointHandler<
      TArgsURL &
        TArgsQuery &
        common.EndpointHandlerArgs<TRefinedContext, TState> &
        common.EndpointHandlerArgsWithBody<TBody>,
      THandlerResult
    >,
    {
      validator: outputValidator,
      ...outputSpec
    }: data.DataValidatorResponseOutputSpec<THandlerResult, TOutputContents>,
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
        infer TArg,
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        unknown,
        infer _1
      >
        ? md.Kind<
            TArg,
            TArgsURL extends common.EndpointHandlerArgsWithURL<unknown>
              ? { [P in keyof TArgsURL["url"]]: unknown }
              : undefined,
            TArgsQuery extends common.EndpointHandlerArgsWithQuery<unknown>
              ? { [P in keyof TArgsQuery["query"]]: unknown }
              : undefined,
            { [P in keyof TInputContentTypes]: TBody },
            { [P in keyof TOutputContents]: THandlerResult }
          >
        : never;
    },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TArgsURL,
    Exclude<ep.HttpMethod, TAllowedMethods>,
    TOutputContents,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { contextTransform, urlValidation } = this._state;
    const handler: state.StaticAppEndpointBuilderSpec<
      TContext,
      TOutputContents,
      TMetadataProviders
    > = {
      inputValidation: inputSpec,
      outputValidation: outputSpec,
      builder: (groupNamePrefix) => {
        const retVal: ep.StaticAppEndpointHandler<TContext> = {
          contextValidator:
            contextTransform as ep.StaticAppEndpointHandler<TContext>["contextValidator"],
          urlValidator: urlValidation
            ? Object.fromEntries(
                Object.entries(urlValidation.validation).map(
                  ([parameterName, { validator }]) => [
                    // Final group name
                    `${groupNamePrefix}${parameterName}`,
                    // URL parameter validation
                    {
                      parameterName,
                      validator,
                    },
                  ],
                ),
              )
            : undefined,
          queryValidator: query?.validator,
          bodyValidator: inputValidator,
          handler: ({ context, state, url, body, query }) => {
            const handlerArgs = {
              ...getEndpointArgs(query),
              context,
              state,
              body: body as TBody,
            };
            if (urlValidation) {
              (
                handlerArgs as unknown as common.EndpointHandlerArgsWithURL<unknown>
              ).url = url;
            }
            return outputValidator(
              endpointHandler(
                handlerArgs as unknown as Parameters<typeof endpointHandler>[0],
              ),
            );
          },
        };
        return retVal;
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      mdArgs: mdArgs as any,
    };
    if (query) {
      handler.queryValidation = ep.omit(query, "validator");
    }
    return new AppEndpointBuilder({
      ...this._state,
      methods: Object.assign(
        {},
        Object.fromEntries(
          Array.from(this._methods.values()).map((method) => [method, handler]),
        ),
        this._state.methods,
      ),
    });
  }
}
