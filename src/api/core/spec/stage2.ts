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
  TValidationError,
  TArgsURL,
  TAllowedMethods extends ep.HttpMethod,
  TArgsQuery,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
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
    protected readonly _methods: Set<TAllowedMethods>,
    protected readonly _queryInfo: common.QueryInfo<
      TValidationError,
      TArgsQuery
    >,
  ) {}

  public withoutBody<
    TOutput,
    TOutputValidatorSpec extends Record<string, unknown>,
  >(
    endpointHandler: common.EndpointHandler<
      TArgsURL &
        TArgsQuery &
        common.EndpointHandlerArgs<TRefinedContext, TState>,
      TOutput
    >,
    {
      validator,
      ...outputSpec
    }: data.DataValidatorResponseOutputSpec<
      TOutput,
      TValidationError,
      TOutputValidatorSpec
    >,
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
        infer TArg,
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        unknown
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
            { [P in keyof TOutputValidatorSpec]: TOutput }
          >
        : never;
    },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    Exclude<ep.HttpMethod, TAllowedMethods>,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { contextTransform, urlValidation } = this._state;
    const handler: state.StaticAppEndpointBuilderSpec<
      TContext,
      TValidationError,
      TMetadataProviders
    > = {
      outputValidation: outputSpec,
      builder: (groupNamePrefix) => {
        const retVal: ep.StaticAppEndpointHandler<TContext, TValidationError> =
          {
            // TODO use runtime pick props for contextValidator!
            contextValidator: contextTransform as ep.StaticAppEndpointHandler<
              TContext,
              TValidationError
            >["contextValidator"],
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
                  handlerArgs as unknown as Parameters<
                    typeof endpointHandler
                  >[0],
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
  TValidationError,
  TArgsURL,
  TAllowedMethods extends ep.HttpMethod,
  TArgsQuery,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> extends AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TAllowedMethods,
  TArgsQuery,
  TMetadataProviders
> {
  public withBody<
    THandlerResult,
    TBody,
    TInputContentTypes extends Record<string, unknown>,
    TOutputValidatorSpec extends Record<string, unknown>,
  >(
    {
      validator: inputValidator,
      ...inputSpec
    }: data.DataValidatorRequestInputSpec<
      TBody,
      TValidationError,
      TInputContentTypes
    >,
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
    }: data.DataValidatorResponseOutputSpec<
      THandlerResult,
      TValidationError,
      TOutputValidatorSpec
    >,
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
        infer TArg,
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        unknown
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
            { [P in keyof TOutputValidatorSpec]: THandlerResult }
          >
        : never;
    },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TArgsURL,
    Exclude<ep.HttpMethod, TAllowedMethods>,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { contextTransform, urlValidation } = this._state;
    const handler: state.StaticAppEndpointBuilderSpec<
      TContext,
      TValidationError,
      TMetadataProviders
    > = {
      inputValidation: inputSpec,
      outputValidation: outputSpec,
      builder: (groupNamePrefix) => {
        const retVal: ep.StaticAppEndpointHandler<TContext, TValidationError> =
          {
            contextValidator: contextTransform as ep.StaticAppEndpointHandler<
              TContext,
              TValidationError
            >["contextValidator"],
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
                  handlerArgs as unknown as Parameters<
                    typeof endpointHandler
                  >[0],
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
