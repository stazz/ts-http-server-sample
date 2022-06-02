import * as utils from "./utils";
import * as methods from "./methods";
import * as data from "./data";
import * as ep from "./endpoint";
import * as md from "./metadata-provider";

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
    md.InitialMetadataProvider<md.HKTArg, unknown, unknown>
  >,
> {
  public constructor(
    private readonly _contextTransform: data.ContextValidatorSpec<
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
    methods.HttpMethod,
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
        methods.HttpMethod,
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
          Object.fromEntries(
            Object.entries(this._mdProviders).map(([key, mdProvider]) => [
              key,
              mdProvider.getBuilder().withURLParameters(validation),
            ]),
          );
          return new AppEndpointBuilderWithURLDataInitial({
            contextTransform: this._contextTransform,
            fragments,
            args,
            validation,
            methods: {},
          });
        },
      };
    } else {
      // URL has no arguments -> return builder which can build endpoints without URL validation
      return new AppEndpointBuilderInitial({
        contextTransform: this._contextTransform,
        fragments,
        methods: {},
      });
    }
  }

  public refineContext<TNewContext>(
    transform: data.ContextValidatorSpec<
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
      Object.fromEntries(
        Object.entries(this._mdProviders).map(([key, provider]) => [
          key,
          provider.withRefinedContext(mdArgs[key]),
        ]),
      ) as TMetadataProviders,
    );
  }

  public withMetadataProvider<
    TMetadataKind extends string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TMetadataProvider extends md.InitialMetadataProvider<any, any, any>,
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
}

export interface URLDataNames<
  TContext,
  TRefinedContext,
  TValidationError,
  TNames extends string,
  TMetadataProviders extends Record<
    string,
    md.InitialMetadataBuilder<md.HKTArg, unknown>
  >,
> {
  validateURLData: <
    TValidation extends {
      [P in TNames]: data.URLDataParameterValidatorSpec<
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
    { [P in TNames]: data.URLParameterDataType<TValidation[P]["validator"]> },
    methods.HttpMethod,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.InitialMetadataBuilder<
        infer TArg,
        infer TEndpointMD
      >
        ? md.MetadataProviderWithURLData<
            TArg,
            TEndpointMD,
            {
              [P in TNames]: data.URLParameterDataType<
                TValidation[P]["validator"]
              >;
            }
          >
        : never;
    }
  >;
}

class AppEndpointBuilderWithURLDataInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends methods.HttpMethod,
  TMetadataProviders extends Record<
    string,
    md.MetadataProviderWithURLData<md.HKTArg, unknown, TDataInURL>
  >,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderWithURLDataState<
      TContext,
      TRefinedContext,
      TValidationError
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & methods.HttpMethodWithoutBody,
  ): AppEndpointBuilderForURLDataAndMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>,
    never,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithURLData<
        infer TArg,
        infer TEndpointMD,
        TDataInURL
      >
        ? md.MetadataProviderWithQuery<TArg, TEndpointMD, TDataInURL, {}> // eslint-disable-line @typescript-eslint/ban-types
        : never;
    }
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & methods.HttpMethodWithBody,
  ): AppEndpointBuilderForURLDataAndMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>,
    never,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithURLData<
        infer TArg,
        infer TEndpointMD,
        TDataInURL
      >
        ? md.MetadataProviderWithQueryAndBody<TArg, TEndpointMD, TDataInURL, {}> // eslint-disable-line @typescript-eslint/ban-types
        : never;
    }
  >;
  public forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods & methods.HttpMethodWithoutBody,
    query: data.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>,
  ): AppEndpointBuilderForURLDataAndMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithURLData<
        infer TArg,
        infer TEndpointMD,
        TDataInURL
      >
        ? md.MetadataProviderWithQuery<
            TArg,
            TEndpointMD,
            TDataInURL,
            { [P in TQueryKeys]: unknown }
          >
        : never;
    }
  >;
  public forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods & methods.HttpMethodWithBody,
    query: data.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>,
  ): AppEndpointBuilderForURLDataAndMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithURLData<
        infer TArg,
        infer TEndpointMD,
        TDataInURL
      >
        ? md.MetadataProviderWithQueryAndBody<
            TArg,
            TEndpointMD,
            TDataInURL,
            { [P in TQueryKeys]: unknown }
          >
        : never;
    }
  >;
  forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods,
    query?: data.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>,
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
        any
        // If we uncomment this one, the TS compiler will claim the first overload signature to be incompatible
        // {
        //   [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithURLData<
        //     infer TArg,
        //     TDataInURL
        //   >
        //     ? md.MetadataProviderWithQuery<
        //         TArg,
        //         TDataInURL,
        //         { [P in string]: unknown }
        //       >
        //     : never;
        // }
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
        // For some reason here, however, it is OK to do like this... :)
        {
          [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithURLData<
            infer TArg,
            infer TEndpointMD,
            TDataInURL
          >
            ? md.MetadataProviderWithQueryAndBody<
                TArg,
                TEndpointMD,
                TDataInURL,
                { [P in string]: unknown }
              >
            : never;
        }
      > {
    const { methodsSet, withoutBody, queryInfo } = forMethodImpl(
      this._state.methods,
      method,
      query,
    );
    return withoutBody
      ? new AppEndpointBuilderForURLDataAndMethods(
          this._state,
          methodsSet,
          queryInfo,
        )
      : new AppEndpointBuilderForURLDataAndMethodsAndBody(
          this._state,
          methodsSet,
          queryInfo,
        );
  }
}

interface StaticAppEndpointBuilderSpec<TContext, TRefinedContext, TBodyError> {
  builder: StaticAppEndpointBuilder<TContext, TRefinedContext, TBodyError>;
  queryValidation?: Omit<
    data.QueryValidatorSpec<unknown, TBodyError, string>,
    "validator"
  >;
  inputValidation?: Omit<
    data.DataValidatorRequestInputSpec<
      unknown,
      TBodyError,
      Record<string, unknown>
    >,
    "validator"
  >;
  outputValidation: Omit<
    data.DataValidatorResponseOutputSpec<
      unknown,
      TBodyError,
      Record<string, unknown>
    >,
    "validator"
  >;
}

type StaticAppEndpointBuilder<TContext, TRefinedContext, TBodyError> = (
  groupNamePrefix: string,
  // groups: Record<string, string>,
) => ep.StaticAppEndpointHandler<TContext, TRefinedContext, TBodyError>;

interface AppEndpointBuilderState<TContext, TRefinedContext, TValidationError> {
  fragments: TemplateStringsArray;
  methods: Partial<
    Record<
      methods.HttpMethod,
      StaticAppEndpointBuilderSpec<TContext, TRefinedContext, TValidationError>
    >
  >;
  contextTransform: data.ContextValidatorSpec<
    TContext,
    TRefinedContext,
    TValidationError
  >;
}

interface AppEndpointBuilderWithURLDataState<
  TContext,
  TRefinedContext,
  TValidationError,
> extends AppEndpointBuilderState<TContext, TRefinedContext, TValidationError> {
  args: ReadonlyArray<string>;
  validation: Record<
    string,
    data.URLDataParameterValidatorSpec<unknown, TValidationError>
  >;
}

export class AppEndpointBuilderWithURLData<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends methods.HttpMethod,
  TMetadataProviders extends Record<
    string,
    md.MetadataProviderWithURLData<md.HKTArg, unknown, TDataInURL>
  >,
> extends AppEndpointBuilderWithURLDataInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods,
  TMetadataProviders
> {
  public createEndpoint(): ep.AppEndpoint<
    TContext,
    TRefinedContext,
    TValidationError,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithURLData<
        infer _,
        infer TEndpointMD,
        TDataInURL
      >
        ? TEndpointMD
        : never;
    }
  > {
    if (Object.keys(this._state.methods).length > 0) {
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
  TAllowedMethods extends methods.HttpMethod,
  TArgs,
  TQueryKeys extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataProviderWithQuery<
      md.HKTArg,
      unknown,
      TDataInURL,
      { [P in TQueryKeys]: unknown }
    >
  >,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderWithURLDataState<
      TContext,
      TRefinedContext,
      TValidationError
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
    }: data.DataValidatorResponseOutputSpec<
      THandlerResult,
      TValidationError,
      TOutputValidatorSpec
    >,
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithQuery<
        infer TArg,
        unknown,
        TDataInURL,
        { [P in TQueryKeys]: unknown }
      >
        ? md.Kind<
            TArg,
            TDataInURL,
            { [P in TQueryKeys]: unknown },
            undefined,
            TOutputValidatorSpec
          >
        : never;
    },
  ): AppEndpointBuilderWithURLData<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    Exclude<methods.HttpMethod, TAllowedMethods>,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithQuery<
        infer TArg,
        infer TEndpointMD,
        TDataInURL,
        { [P in TQueryKeys]: unknown }
      >
        ? md.MetadataProviderWithURLData<TArg, TEndpointMD, TDataInURL>
        : never;
    }
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError
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
    };
    if (query) {
      handler.queryValidation = utils.omit(query, "validator");
    }
    // TODO actually utilize MD args.
    mdArgs;
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
  TAllowedMethods extends methods.HttpMethod,
  TArgs,
  TQueryKeys extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataProviderWithQueryAndBody<
      md.HKTArg,
      unknown,
      TDataInURL,
      { [P in TQueryKeys]: unknown }
    >
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
    }: data.DataValidatorRequestInputSpec<
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
    }: data.DataValidatorResponseOutputSpec<
      TResult,
      TValidationError,
      TOutputValidatorSpec
    >,
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithQueryAndBody<
        infer TArg,
        unknown,
        TDataInURL,
        { [P in TQueryKeys]: unknown }
      >
        ? md.Kind<
            TArg,
            TDataInURL,
            { [P in TQueryKeys]: unknown },
            TInputContentTypes,
            TOutputValidatorSpec
          >
        : never;
    },
  ): AppEndpointBuilderWithURLData<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    Exclude<methods.HttpMethod, TAllowedMethods>,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithQueryAndBody<
        infer TArg,
        infer TEndpointMD,
        TDataInURL,
        { [P in TQueryKeys]: unknown }
      >
        ? md.MetadataProviderWithURLData<TArg, TEndpointMD, TDataInURL>
        : never;
    }
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError
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
      }),
    };
    if (query) {
      handler.queryValidation = utils.omit(query, "validator");
    }
    // TODO actually utilize MD args.
    mdArgs;
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
  TAllowedMethods extends methods.HttpMethod,
  TMetadataProviders extends Record<
    string,
    md.InitialMetadataBuilder<md.HKTArg, unknown>
  >,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TValidationError
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & methods.HttpMethodWithoutBody,
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>,
    never,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.InitialMetadataBuilder<
        infer TArg,
        infer TEndpointMD
      >
        ? md.MetadataProviderWithQuery<TArg, TEndpointMD, undefined, {}> // eslint-disable-line @typescript-eslint/ban-types
        : never;
    }
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & methods.HttpMethodWithBody,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>,
    never,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.InitialMetadataBuilder<
        infer TArg,
        infer TEndpointMD
      >
        ? md.MetadataProviderWithQueryAndBody<TArg, TEndpointMD, undefined, {}> // eslint-disable-line @typescript-eslint/ban-types
        : never;
    }
  >;
  public forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods & methods.HttpMethodWithoutBody,
    query: data.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>,
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.InitialMetadataBuilder<
        infer TArg,
        infer TEndpointMD
      >
        ? md.MetadataProviderWithQuery<
            TArg,
            TEndpointMD,
            undefined,
            { [P in TQueryKeys]: unknown }
          >
        : never;
    }
  >;
  public forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods & methods.HttpMethodWithBody,
    query: data.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>,
    TQueryKeys,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.InitialMetadataBuilder<
        infer TArg,
        infer TEndpointMD
      >
        ? md.MetadataProviderWithQueryAndBody<
            TArg,
            TEndpointMD,
            undefined,
            { [P in TQueryKeys]: unknown }
          >
        : never;
    }
  >;
  forMethod<
    TMethods extends TAllowedMethods,
    TQuery,
    TQueryKeys extends string,
  >(
    method: TMethods,
    query?:
      | data.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>
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
        any
        // {
        //   [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.InitialMetadataBuilder<
        //     infer TArg
        //   >
        //     ? md.MetadataProviderWithQuery<
        //         TArg,
        //         undefined,
        //         { [P in string]: unknown }
        //       >
        //     : never;
        // }
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>,
        string,
        {
          [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.InitialMetadataBuilder<
            infer TArg,
            infer TEndpointMD
          >
            ? md.MetadataProviderWithQueryAndBody<
                TArg,
                TEndpointMD,
                undefined,
                { [P in string]: unknown }
              >
            : never;
        }
      > {
    const { methodsSet, withoutBody, queryInfo } = forMethodImpl(
      this._state.methods,
      method,
      query,
    );
    return withoutBody
      ? new AppEndpointBuilderForMethods(this._state, methodsSet, queryInfo)
      : new AppEndpointBuilderForMethodsAndBody(
          this._state,
          methodsSet,
          queryInfo,
        );
  }
}

export class AppEndpointBuilder<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods extends methods.HttpMethod,
  TMetadataProviders extends Record<
    string,
    md.InitialMetadataBuilder<md.HKTArg, unknown>
  >,
> extends AppEndpointBuilderInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods,
  TMetadataProviders
> {
  public createEndpoint(): ep.AppEndpoint<
    TContext,
    TRefinedContext,
    TValidationError,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.InitialMetadataBuilder<
        infer _,
        infer TEndpointMD
      >
        ? TEndpointMD
        : never;
    }
  > {
    if (Object.keys(this._state.methods).length > 0) {
      return {
        getRegExpAndHandler: (groupNamePrefix) => ({
          url: new RegExp(utils.escapeRegExp(this._state.fragments.join(""))),
          handler: (method) =>
            checkMethodsForHandler(
              this._state.methods,
              method,
              groupNamePrefix,
            ),
        }),
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
  TAllowedMethods extends methods.HttpMethod,
  TArgs,
  TQueryKeys extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataProviderWithQuery<
      md.HKTArg,
      unknown,
      undefined,
      { [P in TQueryKeys]: unknown }
    >
  >,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TValidationError
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
    }: data.DataValidatorResponseOutputSpec<
      TOutput,
      TValidationError,
      TOutputValidatorSpec
    >,
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithQuery<
        infer TArg,
        unknown,
        undefined,
        { [P in TQueryKeys]: unknown }
      >
        ? md.Kind<
            TArg,
            undefined,
            { [P in TQueryKeys]: unknown },
            undefined,
            TOutputValidatorSpec
          >
        : never;
    },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    Exclude<methods.HttpMethod, TAllowedMethods>,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithQuery<
        infer TArg,
        infer TEndpointMD,
        undefined,
        { [P in TQueryKeys]: unknown }
      >
        ? md.InitialMetadataBuilder<TArg, TEndpointMD>
        : never;
    }
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError
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
    };
    if (query) {
      handler.queryValidation = utils.omit(query, "validator");
    }
    // TODO actually utilize MD args.
    mdArgs;
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
  TAllowedMethods extends methods.HttpMethod,
  TArgs,
  TQueryKeys extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataProviderWithQueryAndBody<
      md.HKTArg,
      unknown,
      undefined,
      { [P in TQueryKeys]: unknown }
    >
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
    }: data.DataValidatorRequestInputSpec<
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
    }: data.DataValidatorResponseOutputSpec<
      THandlerResult,
      TValidationError,
      TOutputValidatorSpec
    >,
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithQueryAndBody<
        infer TArg,
        unknown,
        undefined,
        { [P in TQueryKeys]: unknown }
      >
        ? md.Kind<
            TArg,
            undefined,
            { [P in TQueryKeys]: unknown },
            undefined,
            TOutputValidatorSpec
          >
        : never;
    },
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    Exclude<methods.HttpMethod, TAllowedMethods>,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProviderWithQueryAndBody<
        infer TArg,
        infer TEndpointMD,
        undefined,
        { [P in TQueryKeys]: unknown }
      >
        ? md.InitialMetadataBuilder<TArg, TEndpointMD>
        : never;
    }
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError
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
    };
    if (query) {
      handler.queryValidation = utils.omit(query, "validator");
    }
    // TODO actually utilize MD args.
    mdArgs;
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
  query?: data.QueryValidatorSpec<unknown, TValidationError, TQueryKeys>;
  getEndpointArgs: (query: unknown) => TArgs;
}

const forMethodImpl = <
  TMethods extends methods.HttpMethod,
  TQuery,
  TValidationError,
  TQueryKeys extends string,
>(
  stateMethods: Record<string, unknown>,
  method: TMethods,
  queryValidation:
    | data.QueryValidatorSpec<TQuery, TValidationError, TQueryKeys>
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

  return {
    methodsSet: new Set([method]),
    withoutBody: methods.isMethodWithoutBody(method),
    queryInfo,
  };
};

const checkMethodsForHandler = <TContext, TRefinedContext, TValidationError>(
  state: {
    [key: string]: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError
    >;
  },
  method: methods.HttpMethod,
  groupNamePrefix: string,
): ep.DynamicHandlerResponse<TContext, TRefinedContext, TValidationError> =>
  method in state
    ? {
        found: "handler" as const,
        handler: state[method].builder(groupNamePrefix),
      }
    : {
        found: "invalid-method" as const,
        allowedMethods: Object.keys(state) as Array<methods.HttpMethod>,
      };

// For example, from URL string "/api/${id}" and the id parameter adhering to regexp X, build regexp:
// "/api/(?<ep_prefix_id>X)"
// Don't add start/end marks ^/$, since we want to allow prefixing URLs.
const buildURLRegExp = (
  fragments: TemplateStringsArray,
  names: ReadonlyArray<string>,
  validation: Record<
    string,
    data.URLDataParameterValidatorSpec<unknown, unknown>
  >,
  groupNamePrefix: string,
) => {
  return new RegExp(
    fragments.reduce((currentRegExp, fragment, idx) => {
      let fragmentRegExp = utils.escapeRegExp(fragment);
      if (idx < names.length) {
        const name = names[idx];
        fragmentRegExp = `${fragmentRegExp}(?<${groupNamePrefix}${name}>${validation[name].regExp.source})`;
      }
      return `${currentRegExp}${fragmentRegExp}`;
    }, ""),
  );
};
