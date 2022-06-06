import * as core from "../core";
import * as md from "../metadata";
import * as common from "./common";
import * as state from "./state";
import * as stage3 from "./stage3";

export class AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TArgsURL,
  TAllowedMethods extends core.HttpMethod,
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
      TValidationError,
      TMetadataProviders
    >,
    protected readonly _methods: Set<TAllowedMethods>,
    protected readonly _queryInfo: QueryInfo<TValidationError, TArgsQuery>,
  ) {}

  public withoutBody<
    TOutput,
    TOutputValidatorSpec extends Record<string, unknown>,
  >(
    endpointHandler: EndpointHandler<
      TArgsURL & TArgsQuery & common.EndpointHandlerArgs<TRefinedContext>,
      TOutput
    >,
    {
      validator,
      ...outputSpec
    }: core.DataValidatorResponseOutputSpec<
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
  ): stage3.AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    TArgsURL,
    Exclude<core.HttpMethod, TAllowedMethods>,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { contextTransform, urlValidation } = this._state;
    const handler: state.StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    > = {
      outputValidation: outputSpec,
      builder: (groupNamePrefix) => {
        const retVal: core.StaticAppEndpointHandler<
          TContext,
          TRefinedContext,
          TValidationError
        > = {
          contextValidator: contextTransform.validator,
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
          handler: ({ context, url, query }) => {
            const handlerArgs = {
              ...getEndpointArgs(query),
              context,
            };
            if (urlValidation) {
              (
                handlerArgs as unknown as common.EndpointHandlerArgsWithURL<unknown>
              ).url = url;
            }
            return validator(
              endpointHandler(
                handlerArgs as Parameters<typeof endpointHandler>[0],
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
      handler.queryValidation = core.omit(query, "validator");
    }
    return new stage3.AppEndpointBuilder({
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
  TValidationError,
  TArgsURL,
  TAllowedMethods extends core.HttpMethod,
  TArgsQuery,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> extends AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
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
    }: core.DataValidatorRequestInputSpec<
      TBody,
      TValidationError,
      TInputContentTypes
    >,
    endpointHandler: EndpointHandler<
      TArgsURL &
        TArgsQuery &
        common.EndpointHandlerArgs<TRefinedContext> &
        common.EndpointHandlerArgsWithBody<TBody>,
      THandlerResult
    >,
    {
      validator: outputValidator,
      ...outputSpec
    }: core.DataValidatorResponseOutputSpec<
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
  ): stage3.AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    TArgsURL,
    Exclude<core.HttpMethod, TAllowedMethods>,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { contextTransform, urlValidation } = this._state;
    const handler: state.StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    > = {
      inputValidation: inputSpec,
      outputValidation: outputSpec,
      builder: (groupNamePrefix) => {
        const retVal: core.StaticAppEndpointHandler<
          TContext,
          TRefinedContext,
          TValidationError
        > = {
          contextValidator: contextTransform.validator,
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
          handler: ({ context, url, body, query }) => {
            const handlerArgs = {
              ...getEndpointArgs(query),
              context,
              body: body as TBody,
            };
            if (urlValidation) {
              (
                handlerArgs as unknown as common.EndpointHandlerArgsWithURL<unknown>
              ).url = url;
            }
            return outputValidator(
              endpointHandler(
                handlerArgs as Parameters<typeof endpointHandler>[0],
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
      handler.queryValidation = core.omit(query, "validator");
    }
    return new stage3.AppEndpointBuilder({
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

export type EndpointHandler<TArgs, THandlerResult> = (
  args: TArgs,
) => THandlerResult;

export interface QueryInfo<TValidationError, TArgs> {
  query?: core.QueryValidatorSpec<unknown, TValidationError, string>;
  getEndpointArgs: (query: unknown) => TArgs;
}
