import * as core from "../core";
import * as md from "../metadata";

export const bindNecessaryTypes = <
  TContext,
  TValidationError,
  // eslint-disable-next-line @typescript-eslint/ban-types
>(): AppEndpointBuilderProvider<TContext, TContext, TValidationError, {}> =>
  new AppEndpointBuilderProvider(
    {
      validator: (ctx) => ({ error: "none", data: ctx }),
    },
    {},
  );

export class AppEndpointBuilderProvider<
  TContext,
  TRefinedContext,
  TValidationError,
  TMetadataProviders extends Record<
    string,
    md.MetadataProvider<md.HKTArg, unknown, unknown, unknown, unknown, unknown>
  >,
> {
  public constructor(
    private readonly _contextTransform: core.ContextValidatorSpec<
      TContext,
      TRefinedContext,
      TValidationError
    >,
    private readonly _mdProviders: TMetadataProviders,
  ) {}

  public atURL(fragments: TemplateStringsArray): AppEndpointBuilderInitial<
    TContext,
    TRefinedContext,
    TValidationError,
    core.HttpMethod,
    {
      [P in keyof TMetadataProviders]: ReturnType<
        TMetadataProviders[P]["getBuilder"]
      >;
    }
  >;
  public atURL<TArgs extends [string, ...Array<string>]>(
    fragments: TemplateStringsArray,
    ...args: TArgs
  ): URLDataNames<
    TContext,
    TRefinedContext,
    TValidationError,
    TArgs[number],
    {
      [P in keyof TMetadataProviders]: ReturnType<
        TMetadataProviders[P]["getBuilder"]
      >;
    }
  >;
  public atURL<TArgs extends [string, ...Array<string>]>(
    fragments: TemplateStringsArray,
    ...args: TArgs
  ):
    | AppEndpointBuilderInitial<
        TContext,
        TRefinedContext,
        TValidationError,
        core.HttpMethod,
        {
          [P in keyof TMetadataProviders]: ReturnType<
            TMetadataProviders[P]["getBuilder"]
          >;
        }
      >
    | URLDataNames<
        TContext,
        TRefinedContext,
        TValidationError,
        TArgs[number],
        {
          [P in keyof TMetadataProviders]: ReturnType<
            TMetadataProviders[P]["getBuilder"]
          >;
        }
      > {
    if (args.length > 0) {
      // URL template has arguments -> return URL data validator which allows to build endpoints
      return {
        validateURLData: (validation) => {
          return new AppEndpointBuilderWithURLDataInitial({
            contextTransform: this._contextTransform,
            fragments,
            args,
            validation,
            methods: {},
            // TODO fix this typing (may require extracting this method into class, as anonymous methods with method generic arguments don't behave well)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            metadata: core.transformEntries(this._mdProviders, (md) =>
              md.getBuilder(),
            ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          });
        },
      };
    } else {
      // URL has no arguments -> return builder which can build endpoints without URL validation
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return new AppEndpointBuilderInitial({
        contextTransform: this._contextTransform,
        fragments,
        methods: {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        metadata: core.transformEntries(this._mdProviders, (md) =>
          md.getBuilder(),
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
    }
  }

  public refineContext<TNewContext>(
    transform: core.ContextValidatorSpec<
      TRefinedContext,
      TNewContext,
      TValidationError
    >,
    mdArgs: {
      [P in keyof TMetadataProviders]: Parameters<
        TMetadataProviders[P]["withRefinedContext"]
      >[0];
    },
  ): AppEndpointBuilderProvider<
    TContext,
    TNewContext,
    TValidationError,
    TMetadataProviders
  > {
    return new AppEndpointBuilderProvider(
      {
        ...transform,
        validator: (ctx) => {
          const transformed = this._contextTransform.validator(ctx);
          switch (transformed.error) {
            case "none":
              return transform.validator(transformed.data);
            default:
              return transformed;
          }
        },
      },
      core.transformEntries(this._mdProviders, (provider, key) =>
        provider.withRefinedContext(mdArgs[key]),
      ) as TMetadataProviders,
    );
  }

  public withMetadataProvider<
    TMetadataKind extends string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TMetadataProvider extends md.MetadataProvider<any, any, any, any, any, any>,
  >(
    metadataKind: TMetadataKind,
    metadataProvider: TMetadataProvider,
  ): AppEndpointBuilderProvider<
    TContext,
    TRefinedContext,
    TValidationError,
    TMetadataProviders & { [P in TMetadataKind]: TMetadataProvider }
  > {
    return new AppEndpointBuilderProvider(this._contextTransform, {
      ...this._mdProviders,
      [metadataKind]: metadataProvider,
    });
  }

  public getMetadataFinalResult(
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProvider<
        infer _,
        infer _1,
        infer _2,
        infer _3,
        infer TArg,
        unknown
      >
        ? TArg
        : never;
    },
    endpoints: ReadonlyArray<{
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProvider<
        infer _,
        infer _1,
        infer TEndpointMD,
        infer _2,
        infer _3,
        infer _4
      >
        ? Array<TEndpointMD>
        : never;
    }>,
  ): {
    [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProvider<
      infer _,
      infer _1,
      infer _2,
      infer _3,
      infer _4,
      infer TResult
    >
      ? TResult
      : never;
  } {
    return core.transformEntries(this._mdProviders, (md, key) =>
      md.createFinalMetadata(
        mdArgs[key],
        endpoints.flatMap((ep) => ep[key]),
      ),
    ) as {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProvider<
        infer _,
        infer _1,
        infer _2,
        infer _3,
        infer _4,
        infer TResult
      >
        ? TResult
        : never;
    };
  }
}

export interface URLDataNames<
  TContext,
  TRefinedContext,
  TValidationError,
  TNames extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  validateURLData: <
    TValidation extends {
      [P in TNames]: core.URLDataParameterValidatorSpec<
        unknown,
        TValidationError
      >;
    },
  >(
    validation: TValidation,
  ) => AppEndpointBuilderWithURLDataInitial<
    TContext,
    TRefinedContext,
    TValidationError,
    { [P in TNames]: core.URLParameterDataType<TValidation[P]["validator"]> },
    core.HttpMethod,
    TMetadataProviders
  >;
}

class AppEndpointBuilderWithURLDataInitial<
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
    protected readonly _state: AppEndpointBuilderWithURLDataState<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithoutBody,
  ): AppEndpointBuilderForURLDataAndMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>,
    never,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithBody,
  ): AppEndpointBuilderForURLDataAndMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>,
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
  ): AppEndpointBuilderForURLDataAndMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>,
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
  ): AppEndpointBuilderForURLDataAndMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>,
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
    | AppEndpointBuilderForURLDataAndMethods<
        TContext,
        TRefinedContext,
        TValidationError,
        TDataInURL,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>,
        string,
        TMetadataProviders
      >
    | AppEndpointBuilderForURLDataAndMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TDataInURL,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>,
        string,
        TMetadataProviders
      > {
    const methodInfo = forMethodImpl(this._state.methods, method, query);
    return methodInfo.body === "none"
      ? new AppEndpointBuilderForURLDataAndMethods(
          this._state,
          methodInfo.methodsSet,
          methodInfo.queryInfo,
        )
      : new AppEndpointBuilderForURLDataAndMethodsAndBody(
          this._state,
          methodInfo.methodsSet,
          methodInfo.queryInfo,
        );
  }
}

interface StaticAppEndpointBuilderSpec<
  TContext,
  TRefinedContext,
  TBodyError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  builder: StaticAppEndpointBuilder<TContext, TRefinedContext, TBodyError>;
  queryValidation?: Omit<
    core.QueryValidatorSpec<unknown, TBodyError, string>,
    "validator"
  >;
  inputValidation?: Omit<
    core.DataValidatorRequestInputSpec<
      unknown,
      TBodyError,
      Record<string, unknown>
    >,
    "validator"
  >;
  outputValidation: Omit<
    core.DataValidatorResponseOutputSpec<
      unknown,
      TBodyError,
      Record<string, unknown>
    >,
    "validator"
  >;
  mdArgs: {
    [P in keyof TMetadata]: TMetadata[P] extends md.MetadataBuilder<
      infer TArg,
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer _ // eslint-disable-line @typescript-eslint/no-unused-vars
    >
      ? md.Kind<
          TArg,
          Record<string, unknown>,
          Record<string, unknown>,
          Record<string, unknown>,
          Record<string, unknown>
        >
      : never;
  };
}

type StaticAppEndpointBuilder<TContext, TRefinedContext, TBodyError> = (
  groupNamePrefix: string,
  // groups: Record<string, string>,
) => core.StaticAppEndpointHandler<TContext, TRefinedContext, TBodyError>;

interface AppEndpointBuilderState<
  TContext,
  TRefinedContext,
  TValidationError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  fragments: TemplateStringsArray;
  methods: Partial<
    Record<
      core.HttpMethod,
      StaticAppEndpointBuilderSpec<
        TContext,
        TRefinedContext,
        TValidationError,
        TMetadata
      >
    >
  >;
  contextTransform: core.ContextValidatorSpec<
    TContext,
    TRefinedContext,
    TValidationError
  >;
  metadata: TMetadata;
}

interface AppEndpointBuilderWithURLDataState<
  TContext,
  TRefinedContext,
  TValidationError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> extends AppEndpointBuilderState<
    TContext,
    TRefinedContext,
    TValidationError,
    TMetadata
  > {
  args: ReadonlyArray<string>;
  validation: Record<
    string,
    core.URLDataParameterValidatorSpec<unknown, TValidationError>
  >;
}

export class AppEndpointBuilderWithURLData<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends core.HttpMethod,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> extends AppEndpointBuilderWithURLDataInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods,
  TMetadataProviders
> {
  public createEndpoint(mdArgs: {
    [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer TArg,
      unknown
    >
      ? TArg
      : never;
  }): core.AppEndpoint<
    TContext,
    TRefinedContext,
    TValidationError,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer TEndpointMD
      >
        ? TEndpointMD
        : never;
    }
  > {
    if (Object.keys(this._state.methods).length > 0) {
      const metadata = constructMDResults(
        this._state,
        mdArgs,
        Array.from(
          getURLItemsInOrder(
            this._state.fragments,
            this._state.args,
            this._state.validation,
          ),
        ).map((fragmentOrValidation) =>
          typeof fragmentOrValidation === "string"
            ? fragmentOrValidation
            : {
                ...core.omit(fragmentOrValidation.validation, "validator"),
                name: fragmentOrValidation.name,
              },
        ),
      );
      return {
        getRegExpAndHandler: (groupNamePrefix) => ({
          url: buildURLRegExp(
            this._state.fragments,
            this._state.args,
            this._state.validation,
            groupNamePrefix,
          ),
          handler: (method) =>
            checkMethodsForHandler(
              this._state.methods,
              method,
              groupNamePrefix,
            ),
        }),
        getMetadata: (urlPrefix) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return core.transformEntries(metadata, (md) => [
            md(urlPrefix) as typeof md extends md.SingleEndpointResult<
              infer TEndpointMD
            >
              ? TEndpointMD
              : never,
          ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      };
    } else {
      throw new Error(
        "Please specify at least one method before building endpoint",
      );
    }
  }
}

export interface EndpointHandlerArgs<TContext> {
  context: TContext;
}

export interface EndpointHandlerArgsWithURL<TDataInURL> {
  url: TDataInURL;
}

export interface EndpointHandlerArgsWithQuery<TQuery> {
  query: TQuery;
}

export interface EndpointHandlerArgsWithBody<TBody> {
  body: TBody;
}

export type EndpointHandler<TArgs, THandlerResult> = (
  args: TArgs,
) => THandlerResult;

export class AppEndpointBuilderForURLDataAndMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends core.HttpMethod,
  TArgs,
  TQueryKeys extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderWithURLDataState<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    >,
    protected readonly _methods: Set<TAllowedMethods>,
    protected readonly _queryInfo: QueryInfo<
      TValidationError,
      TArgs,
      TQueryKeys
    >,
  ) {}

  public withoutBody<
    THandlerResult,
    TOutputValidatorSpec extends Record<string, unknown>,
  >(
    endpointHandler: EndpointHandler<
      TArgs &
        EndpointHandlerArgs<TRefinedContext> &
        EndpointHandlerArgsWithURL<TDataInURL>,
      THandlerResult
    >,
    {
      validator,
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
            TDataInURL,
            { [P in TQueryKeys]: unknown },
            undefined,
            { [P in keyof TOutputValidatorSpec]: THandlerResult }
          >
        : never;
    },
  ): AppEndpointBuilderWithURLData<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    Exclude<core.HttpMethod, TAllowedMethods>,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    > = {
      outputValidation: outputSpec,
      builder: (groupNamePrefix) => {
        return {
          contextValidator: this._state.contextTransform.validator,
          urlValidator: Object.fromEntries(
            Object.entries(this._state.validation).map(
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
          ),
          queryValidator: query?.validator,
          handler: ({ context, url, query }) =>
            validator(
              endpointHandler({
                ...getEndpointArgs(query),
                context,
                url: url as TDataInURL,
              }),
            ),
        };
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      mdArgs: mdArgs as any,
    };
    if (query) {
      handler.queryValidation = core.omit(query, "validator");
    }
    return new AppEndpointBuilderWithURLData({
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

export class AppEndpointBuilderForURLDataAndMethodsAndBody<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends core.HttpMethod,
  TArgs,
  TQueryKeys extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> extends AppEndpointBuilderForURLDataAndMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods,
  TArgs,
  TQueryKeys,
  TMetadataProviders
> {
  public withBody<
    TResult,
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
      TArgs &
        EndpointHandlerArgs<TRefinedContext> &
        EndpointHandlerArgsWithURL<TDataInURL> &
        EndpointHandlerArgsWithBody<TBody>,
      TResult
    >,
    {
      validator: outputValidator,
      ...outputSpec
    }: core.DataValidatorResponseOutputSpec<
      TResult,
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
            TDataInURL,
            { [P in TQueryKeys]: unknown },
            { [P in keyof TInputContentTypes]: TBody },
            { [P in keyof TOutputValidatorSpec]: TResult }
          >
        : never;
    },
  ): AppEndpointBuilderWithURLData<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    Exclude<core.HttpMethod, TAllowedMethods>,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    > = {
      inputValidation: inputSpec,
      outputValidation: outputSpec,
      builder: (groupNamePrefix) => ({
        contextValidator: this._state.contextTransform.validator,
        urlValidator: Object.fromEntries(
          Object.entries(this._state.validation).map(
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
        ),
        queryValidator: query?.validator,
        bodyValidator: inputValidator,
        handler: ({ context, url, body, query }) =>
          outputValidator(
            endpointHandler({
              ...getEndpointArgs(query),
              context,
              url: url as TDataInURL,
              body: body as TBody,
            }),
          ),
      }), // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      mdArgs: mdArgs as any,
    };
    if (query) {
      handler.queryValidation = core.omit(query, "validator");
    }
    return new AppEndpointBuilderWithURLData({
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
    protected readonly _state: AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithoutBody,
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>,
    never,
    TMetadataProviders
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & core.HttpMethodWithBody,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>,
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
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>,
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
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>,
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
    | AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TValidationError,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>,
        string,
        TMetadataProviders
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>,
        string,
        TMetadataProviders
      > {
    const methodInfo = forMethodImpl(this._state.methods, method, query);
    return methodInfo.body === "none"
      ? new AppEndpointBuilderForMethods(
          this._state,
          methodInfo.methodsSet,
          methodInfo.queryInfo,
        )
      : new AppEndpointBuilderForMethodsAndBody(
          this._state,
          methodInfo.methodsSet,
          methodInfo.queryInfo,
        );
  }
}

export class AppEndpointBuilder<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods extends core.HttpMethod,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> extends AppEndpointBuilderInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods,
  TMetadataProviders
> {
  public createEndpoint(mdArgs: {
    [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer TArg,
      unknown
    >
      ? TArg
      : never;
  }): core.AppEndpoint<
    TContext,
    TRefinedContext,
    TValidationError,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer TEndpointMD
      >
        ? TEndpointMD
        : never;
    }
  > {
    if (Object.keys(this._state.methods).length > 0) {
      const metadata = constructMDResults(this._state, mdArgs, [
        ...this._state.fragments,
      ]);
      return {
        getRegExpAndHandler: (groupNamePrefix) => ({
          url: new RegExp(core.escapeRegExp(this._state.fragments.join(""))),
          handler: (method) =>
            checkMethodsForHandler(
              this._state.methods,
              method,
              groupNamePrefix,
            ),
        }),
        getMetadata: (urlPrefix) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return core.transformEntries(metadata, (md) => [
            md(urlPrefix) as typeof md extends md.SingleEndpointResult<
              infer TEndpointMD
            >
              ? TEndpointMD
              : never,
          ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      };
    } else {
      throw new Error(
        "Please specify at least one method before building endpoint",
      );
    }
  }
}

export class AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods extends core.HttpMethod,
  TArgs,
  TQueryKeys extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    >,
    protected readonly _methods: Set<TAllowedMethods>,
    protected readonly _queryInfo: QueryInfo<
      TValidationError,
      TArgs,
      TQueryKeys
    >,
  ) {}

  public withoutBody<
    TOutput,
    TOutputValidatorSpec extends Record<string, unknown>,
  >(
    endpointHandler: EndpointHandler<
      TArgs & EndpointHandlerArgs<TRefinedContext>,
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
            undefined,
            { [P in TQueryKeys]: unknown },
            undefined,
            { [P in keyof TOutputValidatorSpec]: TOutput }
          >
        : never;
    },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    Exclude<core.HttpMethod, TAllowedMethods>,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    > = {
      outputValidation: outputSpec,
      builder: () => ({
        contextValidator: this._state.contextTransform.validator,
        queryValidator: query?.validator,
        handler: ({ context, query }) =>
          validator(
            endpointHandler({
              ...getEndpointArgs(query),
              context: context,
            }),
          ),
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      mdArgs: mdArgs as any,
    };
    if (query) {
      handler.queryValidation = core.omit(query, "validator");
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
  TValidationError,
  TAllowedMethods extends core.HttpMethod,
  TArgs,
  TQueryKeys extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> extends AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods,
  TArgs,
  TQueryKeys,
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
      TArgs &
        EndpointHandlerArgs<TRefinedContext> &
        EndpointHandlerArgsWithBody<TBody>,
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
            undefined,
            { [P in TQueryKeys]: unknown },
            { [P in keyof TInputContentTypes]: TBody },
            { [P in keyof TOutputValidatorSpec]: THandlerResult }
          >
        : never;
    },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    Exclude<core.HttpMethod, TAllowedMethods>,
    TMetadataProviders
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    > = {
      inputValidation: inputSpec,
      outputValidation: outputSpec,
      builder: () => ({
        contextValidator: this._state.contextTransform.validator,
        queryValidator: query?.validator,
        bodyValidator: inputValidator,
        handler: ({ context, body, query }) =>
          outputValidator(
            endpointHandler({
              ...getEndpointArgs(query),
              context,
              body: body as TBody,
            }),
          ),
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      mdArgs: mdArgs as any,
    };
    if (query) {
      handler.queryValidation = core.omit(query, "validator");
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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

interface QueryInfo<TValidationError, TArgs, TQueryKeys extends string> {
  query?: core.QueryValidatorSpec<unknown, TValidationError, TQueryKeys>;
  getEndpointArgs: (query: unknown) => TArgs;
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

  const queryInfo: QueryInfo<
    TValidationError,
    EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys
  > = {
    getEndpointArgs: (q) =>
      queryValidation
        ? { query: q as TQuery }
        : // Fugly, but has to do for now.
          ({} as EndpointHandlerArgsWithQuery<TQuery>),
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

const checkMethodsForHandler = <
  TContext,
  TRefinedContext,
  TValidationError,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
>(
  state: {
    [key: string]: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadataProviders
    >;
  },
  method: core.HttpMethod,
  groupNamePrefix: string,
): core.DynamicHandlerResponse<TContext, TRefinedContext, TValidationError> =>
  method in state
    ? {
        found: "handler" as const,
        handler: state[method].builder(groupNamePrefix),
      }
    : {
        found: "invalid-method" as const,
        allowedMethods: Object.keys(state) as Array<core.HttpMethod>,
      };

function* getURLItemsInOrder(
  fragments: TemplateStringsArray,
  names: ReadonlyArray<string>,
  validation: Record<
    string,
    core.URLDataParameterValidatorSpec<unknown, unknown>
  >,
) {
  for (const [idx, fragment] of fragments.entries()) {
    yield fragment;
    if (idx < names.length) {
      const name = names[idx];
      yield {
        name,
        validation: validation[name],
      };
    }
  }
}

// For example, from URL string "/api/${id}" and the id parameter adhering to regexp X, build regexp:
// "/api/(?<ep_prefix_id>X)"
// Don't add start/end marks ^/$, since we want to allow prefixing URLs.
const buildURLRegExp = (
  fragments: TemplateStringsArray,
  names: ReadonlyArray<string>,
  validation: Record<
    string,
    core.URLDataParameterValidatorSpec<unknown, unknown>
  >,
  groupNamePrefix: string,
) => {
  return new RegExp(
    Array.from(getURLItemsInOrder(fragments, names, validation)).reduce<string>(
      (currentRegExp, fragmentOrValidation) => {
        return `${currentRegExp}${
          typeof fragmentOrValidation === "string"
            ? core.escapeRegExp(fragmentOrValidation)
            : `(?<${groupNamePrefix}${fragmentOrValidation.name}>${fragmentOrValidation.validation.regExp.source})`
        }`;
      },
      "",
    ),
  );
  // return new RegExp(
  //   fragments.reduce((currentRegExp, fragment, idx) => {
  //     let fragmentRegExp = core.escapeRegExp(fragment);
  //     if (idx < names.length) {
  //       const name = names[idx];
  //       fragmentRegExp = `${fragmentRegExp}(?<${groupNamePrefix}${name}>${validation[name].regExp.source})`;
  //     }
  //     return `${currentRegExp}${fragmentRegExp}`;
  //   }, ""),
  // );
};

const constructMDResults = <
  TContext,
  TRefinedContext,
  TValidationError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
>(
  state: Pick<
    AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TValidationError,
      TMetadata
    >,
    "metadata" | "methods"
  >,
  mdArgs: {
    [P in keyof TMetadata]: TMetadata[P] extends md.MetadataBuilder<
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer TArg,
      unknown
    >
      ? TArg
      : never;
  },
  urlSpec: ReadonlyArray<
    | string
    | (Omit<
        core.URLDataParameterValidatorSpec<unknown, unknown>,
        "validator"
      > & { name: string })
  >,
) => {
  return core.transformEntries(state.metadata, (md, mdKey) =>
    md.getEndpointsMetadata(
      mdArgs[mdKey],
      urlSpec,
      Object.fromEntries(
        Object.entries(state.methods).map(([method, methodInfo]) => {
          return [
            method,
            {
              querySpec: methodInfo.queryValidation,
              inputSpec: methodInfo.inputValidation,
              outputSpec: methodInfo.outputValidation,
              metadataArguments: methodInfo.mdArgs[mdKey],
            },
          ];
        }),
      ),
    ),
  );
};
