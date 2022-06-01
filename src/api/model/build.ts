import * as utils from "./utils";
import * as methods from "./methods";
import * as data from "./data";
import * as ep from "./endpoint";

export const bindNecessaryTypes = <
  TContext,
  TValidationError,
>(): AppEndpointBuilderProvider<TContext, TContext, TValidationError> =>
  new AppEndpointBuilderProvider<TContext, TContext, TValidationError>({
    validator: (ctx) => ({ error: "none", data: ctx }),
  });

export class AppEndpointBuilderProvider<
  TContext,
  TRefinedContext,
  TValidationError,
> {
  public constructor(
    private readonly _contextTransform: data.ContextValidatorSpec<
      TContext,
      TRefinedContext,
      TValidationError
    >,
  ) {}

  public atURL(
    fragments: TemplateStringsArray,
  ): AppEndpointBuilderInitial<
    TContext,
    TRefinedContext,
    TValidationError,
    methods.HttpMethod
  >;
  public atURL<TArgs extends [string, ...Array<string>]>(
    fragments: TemplateStringsArray,
    ...args: TArgs
  ): URLDataNames<TContext, TRefinedContext, TValidationError, TArgs[number]>;
  public atURL<TArgs extends [string, ...Array<string>]>(
    fragments: TemplateStringsArray,
    ...args: TArgs
  ):
    | AppEndpointBuilderInitial<
        TContext,
        TRefinedContext,
        TValidationError,
        methods.HttpMethod
      >
    | URLDataNames<TContext, TRefinedContext, TValidationError, TArgs[number]> {
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
  ): AppEndpointBuilderProvider<TContext, TNewContext, TValidationError> {
    return new AppEndpointBuilderProvider({
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
    });
  }
}

export interface URLDataNames<
  TContext,
  TRefinedContext,
  TValidationError,
  TNames extends string,
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
    methods.HttpMethod
  >;
}

class AppEndpointBuilderWithURLDataInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends methods.HttpMethod,
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
    never
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
    never
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
    TQueryKeys
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
    TQueryKeys
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
        string
      >
    | AppEndpointBuilderForURLDataAndMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TDataInURL,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>,
        string
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
> extends AppEndpointBuilderWithURLDataInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods
> {
  public createEndpoint(): ep.AppEndpoint<
    TContext,
    TRefinedContext,
    TValidationError
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
  ): AppEndpointBuilderWithURLData<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    Exclude<methods.HttpMethod, TAllowedMethods>
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
> extends AppEndpointBuilderForURLDataAndMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods,
  TArgs,
  TQueryKeys
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
  ): AppEndpointBuilderWithURLData<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    Exclude<methods.HttpMethod, TAllowedMethods>
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
    never
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & methods.HttpMethodWithBody,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>,
    never
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
    TQueryKeys
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
    TQueryKeys
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
        string
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>,
        string
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
> extends AppEndpointBuilderInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods
> {
  public createEndpoint(): ep.AppEndpoint<
    TContext,
    TRefinedContext,
    TValidationError
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
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    Exclude<methods.HttpMethod, TAllowedMethods>
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
> extends AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods,
  TArgs,
  TQueryKeys
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
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    Exclude<methods.HttpMethod, TAllowedMethods>
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
