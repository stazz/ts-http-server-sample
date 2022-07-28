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
  TArgsHeaders,
  TArgsQuery,
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<
      md.HKTArg,
      unknown,
      unknown,
      TOutputContents,
      TInputContents
    >
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
    protected readonly _methods: Set<TAllowedMethods>,
    protected readonly _queryInfo: common.QueryInfo<TArgsQuery>,
    protected readonly _headerInfo: common.HeaderDataInfo<TArgsHeaders>,
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
        infer _1,
        infer _2
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
    TInputContents,
    TMetadataProviders
  > {
    const { query, getEndpointArgs: getQueryEndpointArgs } = this._queryInfo;
    const { headers, getEndpointArgs: getHeaderEndpointArgs } =
      this._headerInfo;
    const { contextTransform, urlValidation } = this._state;
    const handler: state.StaticAppEndpointBuilderSpec<
      TContext,
      TOutputContents,
      TInputContents,
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
          headerValidator: headers?.validators,
          handler: async ({ context, state, url, headers, query }) => {
            const handlerArgs = {
              ...getQueryEndpointArgs(query),
              ...getHeaderEndpointArgs(headers),
              context,
              state,
            };
            if (urlValidation) {
              (
                handlerArgs as unknown as common.EndpointHandlerArgsWithURL<unknown>
              ).url = url;
            }
            return validator(
              await endpointHandler(
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
  TArgsHeaders,
  TArgsQuery,
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<
      md.HKTArg,
      unknown,
      unknown,
      TOutputContents,
      TInputContents
    >
  >,
> extends AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TState,
  TArgsURL,
  TAllowedMethods,
  TArgsHeaders,
  TArgsQuery,
  TOutputContents,
  TInputContents,
  TMetadataProviders
> {
  public withBody<THandlerResult, TBody>(
    {
      validator: inputValidator,
      ...inputSpec
    }: data.DataValidatorRequestInputSpec<TBody, TInputContents>,
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
        infer _1,
        infer _2
      >
        ? md.Kind<
            TArg,
            TArgsURL extends common.EndpointHandlerArgsWithURL<unknown>
              ? { [P in keyof TArgsURL["url"]]: unknown }
              : undefined,
            TArgsQuery extends common.EndpointHandlerArgsWithQuery<unknown>
              ? { [P in keyof TArgsQuery["query"]]: unknown }
              : undefined,
            { [P in keyof TInputContents]: TBody },
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
    TInputContents,
    TMetadataProviders
  > {
    const { query, getEndpointArgs: getQueryEndpointArgs } = this._queryInfo;
    const { headers, getEndpointArgs: getHeaderEndpointArgs } =
      this._headerInfo;
    const { contextTransform, urlValidation } = this._state;
    const handler: state.StaticAppEndpointBuilderSpec<
      TContext,
      TOutputContents,
      TInputContents,
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
          headerValidator: headers?.validators,
          queryValidator: query?.validator,
          bodyValidator: inputValidator,
          handler: async ({ context, state, url, headers, body, query }) => {
            const handlerArgs = {
              ...getQueryEndpointArgs(query),
              ...getHeaderEndpointArgs(headers),
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
              await endpointHandler(
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
