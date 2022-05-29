import * as utils from "./utils";
import * as method from "./method";
import * as url from "./url";
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
    method.HttpMethod
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
        method.HttpMethod
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

// TODO allow validator to return custom http status

export interface URLDataNames<
  TContext,
  TRefinedContext,
  TValidationError,
  TNames extends string,
> {
  validateURLData: <TValidation extends URLNamedDataValidation<TNames>>(
    validation: TValidation,
  ) => AppEndpointBuilderWithURLDataInitial<
    TContext,
    TRefinedContext,
    TValidationError,
    {
      [P in TNames]: ReturnType<TValidation[P]["transform"]>;
    },
    method.HttpMethod
  >;
}

export type URLNamedDataValidation<TNames extends PropertyKey> = Record<
  TNames,
  url.URLDataTransformer<unknown>
>;

class AppEndpointBuilderWithURLDataInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends method.HttpMethod,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderWithURLDataState<
      TContext,
      TRefinedContext,
      TValidationError
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & HttpMethodWithoutBody,
  ): AppEndpointBuilderForURLDataAndMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & HttpMethodWithBody,
  ): AppEndpointBuilderForURLDataAndMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>
  >;
  public forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods & HttpMethodWithoutBody,
    query: data.QueryValidatorSpec<TQuery, TValidationError>,
  ): AppEndpointBuilderForURLDataAndMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>
  >;
  public forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods & HttpMethodWithBody,
    query: data.QueryValidatorSpec<TQuery, TValidationError>,
  ): AppEndpointBuilderForURLDataAndMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>
  >;
  forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods,
    query?: data.QueryValidatorSpec<TQuery, TValidationError>,
  ):
    | AppEndpointBuilderForURLDataAndMethods<
        TContext,
        TRefinedContext,
        TValidationError,
        TDataInURL,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>
      >
    | AppEndpointBuilderForURLDataAndMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TDataInURL,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>
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
    data.QueryValidatorSpec<unknown, TBodyError>,
    "validator"
  >;
  inputValidation?: Omit<
    data.DataValidatorRequestInputSpec<unknown, TBodyError>,
    "validator"
  >;
  outputValidation: Omit<
    data.DataValidatorResponseOutputSpec<unknown, TBodyError>,
    "validator"
  >;
}

type StaticAppEndpointBuilder<TContext, TRefinedContext, TBodyError> = (
  groupNamePrefix: string,
  groups: Record<string, string>,
) => ep.StaticAppEndpointHandler<TContext, TRefinedContext, TBodyError>;

interface AppEndpointBuilderState<TContext, TRefinedContext, TValidationError> {
  fragments: TemplateStringsArray;
  methods: Partial<
    Record<
      method.HttpMethod,
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
  validation: Record<string, url.URLDataTransformer<unknown>>;
}

export class AppEndpointBuilderWithURLData<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends method.HttpMethod,
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
          handler: (method, groups) =>
            checkMethodsForHandler(
              this._state.methods,
              method,
              groupNamePrefix,
              groups,
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
  TAllowedMethods extends method.HttpMethod,
  TArgs,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderWithURLDataState<
      TContext,
      TRefinedContext,
      TValidationError
    >,
    protected readonly _methods: Set<TAllowedMethods>,
    protected readonly _queryInfo: QueryInfo<TValidationError, TArgs>,
  ) {}

  public withoutBody<THandlerResult>(
    endpointHandler: EndpointHandler<
      TArgs &
        EndpointHandlerArgs<TRefinedContext> &
        EndpointHandlerArgsWithURL<TDataInURL>,
      THandlerResult
    >,
    {
      validator,
      ...outputSpec
    }: data.DataValidatorResponseOutputSpec<THandlerResult, TValidationError>,
  ): AppEndpointBuilderWithURLData<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    Exclude<method.HttpMethod, TAllowedMethods>
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { validator: queryValidator, ...querySpec } = query ?? {};
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError
    > = {
      queryValidation: querySpec,
      outputValidation: outputSpec,
      builder: (groupNamePrefix, groups) => {
        return {
          contextValidator: this._state.contextTransform.validator,
          queryValidator,
          handler: ({ context, query }) =>
            validator(
              endpointHandler({
                ...getEndpointArgs(query),
                context,
                url: buildURLDataObject(
                  this._state.args,
                  this._state.validation,
                  groups,
                  groupNamePrefix,
                ) as unknown as TDataInURL,
              }),
            ),
        };
      },
    };
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
  TAllowedMethods extends method.HttpMethod,
  TArgs,
> extends AppEndpointBuilderForURLDataAndMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods,
  TArgs
> {
  public withBody<TResult, TBody>(
    {
      validator: inputValidator,
      ...inputSpec
    }: data.DataValidatorRequestInputSpec<TBody, TValidationError>,
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
    }: data.DataValidatorResponseOutputSpec<TResult, TValidationError>,
  ): AppEndpointBuilderWithURLData<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    Exclude<method.HttpMethod, TAllowedMethods>
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { validator: queryValidator, ...querySpec } = query ?? {};

    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError
    > = {
      queryValidation: querySpec,
      inputValidation: inputSpec,
      outputValidation: outputSpec,
      builder: (groupNamePrefix, groups) => ({
        contextValidator: this._state.contextTransform.validator,
        queryValidator,
        bodyValidator: inputValidator,
        handler: ({ context, body, query }) =>
          outputValidator(
            endpointHandler({
              ...getEndpointArgs(query),
              context,
              url: buildURLDataObject(
                this._state.args,
                this._state.validation,
                groups,
                groupNamePrefix,
              ) as unknown as TDataInURL,
              body: body as TBody,
            }),
          ),
      }),
    };
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

const HttpMethodsWithoutBody = {
  GET: true,
} as const;

export type HttpMethodWithoutBody = keyof typeof HttpMethodsWithoutBody;
export type HttpMethodWithBody = Exclude<
  method.HttpMethod,
  HttpMethodWithoutBody
>;

export class AppEndpointBuilderInitial<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods extends method.HttpMethod,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TValidationError
    >,
  ) {}

  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & HttpMethodWithoutBody,
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>
  >;
  public forMethod<TMethods extends TAllowedMethods>(
    method: TMethods & HttpMethodWithBody,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext>
  >;
  public forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods & HttpMethodWithoutBody,
    query: data.QueryValidatorSpec<TQuery, TValidationError>,
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>
  >;
  public forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods & HttpMethodWithBody,
    query: data.QueryValidatorSpec<TQuery, TValidationError>,
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods,
    EndpointHandlerArgs<TRefinedContext> & EndpointHandlerArgsWithQuery<TQuery>
  >;
  forMethod<TMethods extends TAllowedMethods, TQuery>(
    method: TMethods,
    query?: data.QueryValidatorSpec<TQuery, TValidationError> | undefined,
  ):
    | AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TValidationError,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TMethods,
        | EndpointHandlerArgs<TRefinedContext>
        | EndpointHandlerArgsWithQuery<TQuery>
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
  TAllowedMethods extends method.HttpMethod,
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
          handler: (method, groups) =>
            checkMethodsForHandler(
              this._state.methods,
              method,
              groupNamePrefix,
              groups,
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
  TAllowedMethods extends method.HttpMethod,
  TArgs,
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TValidationError
    >,
    protected readonly _methods: Set<TAllowedMethods>,
    protected readonly _queryInfo: QueryInfo<TValidationError, TArgs>,
  ) {}

  public withoutBody<TOutput>(
    endpointHandler: EndpointHandler<
      TArgs & EndpointHandlerArgs<TRefinedContext>,
      TOutput
    >,
    {
      validator,
      ...outputSpec
    }: data.DataValidatorResponseOutputSpec<TOutput, TValidationError>,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    Exclude<method.HttpMethod, TAllowedMethods>
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { validator: queryValidator, ...querySpec } = query ?? {};
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError
    > = {
      queryValidation: querySpec,
      outputValidation: outputSpec,
      builder: () => ({
        contextValidator: this._state.contextTransform.validator,
        queryValidator,
        handler: ({ context, query }) =>
          validator(
            endpointHandler({
              ...getEndpointArgs(query),
              context: context,
            }),
          ),
      }),
    };
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
  TAllowedMethods extends method.HttpMethod,
  TArgs,
> extends AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods,
  TArgs
> {
  public withBody<THandlerResult, TBody>(
    {
      validator: inputValidator,
      ...inputSpec
    }: data.DataValidatorRequestInputSpec<TBody, TValidationError>,
    endpointHandler: EndpointHandler<
      TArgs &
        EndpointHandlerArgs<TRefinedContext> &
        EndpointHandlerArgsWithBody<TBody>,
      THandlerResult
    >,
    {
      validator: outputValidator,
      ...outputSpec
    }: data.DataValidatorResponseOutputSpec<THandlerResult, TValidationError>,
  ): AppEndpointBuilder<
    TContext,
    TRefinedContext,
    TValidationError,
    Exclude<method.HttpMethod, TAllowedMethods>
  > {
    const { query, getEndpointArgs } = this._queryInfo;
    const { validator: queryValidator, ...querySpec } = query ?? {};
    const handler: StaticAppEndpointBuilderSpec<
      TContext,
      TRefinedContext,
      TValidationError
    > = {
      queryValidation: querySpec,
      inputValidation: inputSpec,
      outputValidation: outputSpec,
      builder: () => ({
        contextValidator: this._state.contextTransform.validator,
        queryValidator,
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

interface QueryInfo<TValidationError, TArgs> {
  query?: data.QueryValidatorSpec<unknown, TValidationError>;
  getEndpointArgs: (query: unknown) => TArgs;
}

const forMethodImpl = <
  TMethods extends method.HttpMethod,
  TQuery,
  TValidationError,
>(
  stateMethods: Record<string, unknown>,
  method: TMethods,
  queryValidation:
    | data.QueryValidatorSpec<TQuery, TValidationError>
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
    EndpointHandlerArgsWithQuery<TQuery>
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
    withoutBody: method in HttpMethodsWithoutBody,
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
  method: method.HttpMethod,
  groupNamePrefix: string,
  groups: Record<string, string>,
): ep.DynamicHandlerResponse<TContext, TRefinedContext, TValidationError> =>
  method in state
    ? {
        found: "handler" as const,
        handler: state[method].builder(groupNamePrefix, groups),
      }
    : {
        found: "invalid-method" as const,
        allowedMethods: Object.keys(state) as Array<method.HttpMethod>,
      };

const buildURLDataObject = (
  args: ReadonlyArray<string>,
  validation: URLNamedDataValidation<string>,
  groups: Record<string, string>,
  groupNamePrefix: string,
) => {
  return Object.fromEntries(
    args.map(
      (propKey) =>
        [
          propKey,
          validation[propKey].transform(groups[`${groupNamePrefix}${propKey}`]),
        ] as const,
    ),
  );
};

// For example, from URL string "/api/${id}" and the id parameter adhering to regexp X, build regexp:
// "/api/(?<ep_prefix_id>X)"
// Don't add start/end marks ^/$, since we want to allow prefixing URLs.
const buildURLRegExp = (
  fragments: TemplateStringsArray,
  names: ReadonlyArray<string>,
  validation: Record<string, url.URLDataTransformer<unknown>>,
  groupNamePrefix: string,
) => {
  return new RegExp(
    fragments.reduce((currentRegExp, fragment, idx) => {
      let fragmentRegExp = utils.escapeRegExp(fragment);
      if (idx < names.length) {
        const name = names[idx];
        fragmentRegExp = `${fragmentRegExp}(?<${groupNamePrefix}${name}>${validation[name].regexp.source})`;
      }
      return `${currentRegExp}${fragmentRegExp}`;
    }, ""),
  );
};
