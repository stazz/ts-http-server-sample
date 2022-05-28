import * as utils from "./utils";
import * as method from "./method";
import * as url from "./url";
import * as data from "./data";
import * as ep from "./endpoint";

export const bindNecessaryTypes = <TContext, TValidationError>(
  initialContextMetadata: Omit<
    data.ContextValidatorSpec<TContext, TContext, TValidationError>,
    "validator"
  >,
): AppEndpointBuilderProvider<TContext, TContext, TValidationError> =>
  new AppEndpointBuilderProvider<TContext, TContext, TValidationError>({
    ...initialContextMetadata,
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

  public forMethods<TMethods extends TAllowedMethods>(
    method: TMethods & HttpMethodWithoutBody,
    ...methods: Array<TMethods>
  ): AppEndpointBuilderForURLDataAndMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods
  >;
  public forMethods<TMethods extends TAllowedMethods>(
    method: TMethods & HttpMethodWithBody,
    ...httpMethods: Array<TMethods>
  ): AppEndpointBuilderForURLDataAndMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TDataInURL,
    TMethods
  >;
  forMethods<TMethods extends TAllowedMethods>(
    method: TMethods,
    ...methods: Array<TMethods>
  ):
    | AppEndpointBuilderForURLDataAndMethods<
        TContext,
        TRefinedContext,
        TValidationError,
        TDataInURL,
        TMethods
      >
    | AppEndpointBuilderForURLDataAndMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TDataInURL,
        TMethods
      > {
    const { methodsSet, withoutBody } = forMethodsImpl(
      this._state.methods,
      method,
      methods,
    );
    return withoutBody
      ? new AppEndpointBuilderForURLDataAndMethods(this._state, methodsSet)
      : new AppEndpointBuilderForURLDataAndMethodsAndBody(
          this._state,
          methodsSet,
        );
  }
}

interface StaticAppEndpointBuilderSpec<TContext, TBodyError> {
  builder: StaticAppEndpointBuilder<TContext, TBodyError>;
  inputValidation?: Omit<
    data.DataValidatorRequestInputSpec<unknown, TBodyError>,
    "validator"
  >;
  outputValidation: Omit<
    data.DataValidatorResponseOutputSpec<unknown, TBodyError>,
    "validator"
  >;
}

type StaticAppEndpointBuilder<TContext, TBodyError> = (
  groupNamePrefix: string,
  groups: Record<string, string>,
) => ep.StaticAppEndpointHandler<TContext, TBodyError>;

interface AppEndpointBuilderState<TContext, TRefinedContext, TValidationError> {
  fragments: TemplateStringsArray;
  methods: Partial<
    Record<
      method.HttpMethod,
      StaticAppEndpointBuilderSpec<TContext, TValidationError>
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
  public createEndpoint(): ep.AppEndpoint<TContext, TValidationError> {
    if (Object.keys(this._state.methods).length > 0) {
      return {
        getRegExpAndHandler: (groupNamePrefix) => ({
          url: buildURLRegExp(
            this._state.fragments,
            this._state.args,
            this._state.validation,
          )(groupNamePrefix),
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

export class AppEndpointBuilderForURLDataAndMethods<
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
    protected readonly _methods: Set<TAllowedMethods>,
  ) {}

  public withoutBody<THandlerResult>(
    endpointHandler: (
      urlData: TDataInURL,
      context: TRefinedContext,
    ) => THandlerResult,
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
    const handler: StaticAppEndpointBuilderSpec<TContext, TValidationError> = {
      outputValidation: outputSpec,
      builder: (groupNamePrefix, groups) => ({
        contextValidator: this._state.contextTransform.validator,
        handler: (ctx) =>
          postTransform(
            ctx,
            this._state.contextTransform,
            (transformedContext) =>
              validator(
                endpointHandler(
                  buildURLDataObject(
                    this._state.args,
                    this._state.validation,
                    groups,
                    groupNamePrefix,
                  ) as unknown as TDataInURL,
                  transformedContext,
                ),
              ),
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

export class AppEndpointBuilderForURLDataAndMethodsAndBody<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends method.HttpMethod,
> extends AppEndpointBuilderForURLDataAndMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods
> {
  public withBody<TResult, TBody>(
    {
      validator: inputValidator,
      ...inputSpec
    }: data.DataValidatorRequestInputSpec<TBody, TValidationError>,
    endpointHandler: (
      urlData: TDataInURL,
      bodyData: TBody,
      context: TRefinedContext,
    ) => TResult,
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
    const handler: StaticAppEndpointBuilderSpec<TContext, TValidationError> = {
      inputValidation: inputSpec,
      outputValidation: outputSpec,
      builder: (groupNamePrefix, groups) => ({
        contextValidator: this._state.contextTransform.validator,
        isBodyValid: inputValidator,
        handler: (ctx, body) =>
          postTransform(
            ctx,
            this._state.contextTransform,
            (transformedContext) =>
              outputValidator(
                endpointHandler(
                  buildURLDataObject(
                    this._state.args,
                    this._state.validation,
                    groups,
                    groupNamePrefix,
                  ) as unknown as TDataInURL,
                  body as TBody,
                  transformedContext,
                ),
              ),
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

// Notice! If we have here only one literal instead of union of two or more, the "forMethods" will not work properly when called with first variation!
export type HttpMethodWithoutBody = "GET" | "HEAD";
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

  public forMethods<TMethods extends TAllowedMethods>(
    method: TMethods & HttpMethodWithoutBody,
    ...methods: Array<TMethods>
  ): AppEndpointBuilderForMethods<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods
  >;
  public forMethods<TMethods extends TAllowedMethods>(
    method: TMethods & HttpMethodWithBody,
    ...httpMethods: Array<TMethods>
  ): AppEndpointBuilderForMethodsAndBody<
    TContext,
    TRefinedContext,
    TValidationError,
    TMethods
  >;
  public forMethods<TMethods extends TAllowedMethods>(
    method: TMethods,
    ...methods: Array<TMethods>
  ):
    | AppEndpointBuilderForMethods<
        TContext,
        TRefinedContext,
        TValidationError,
        TMethods
      >
    | AppEndpointBuilderForMethodsAndBody<
        TContext,
        TRefinedContext,
        TValidationError,
        TMethods
      > {
    const { methodsSet, withoutBody } = forMethodsImpl(
      this._state.methods,
      method,
      methods,
    );
    return withoutBody
      ? new AppEndpointBuilderForMethods(this._state, methodsSet)
      : new AppEndpointBuilderForMethodsAndBody(this._state, methodsSet);
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
  public createEndpoint(): ep.AppEndpoint<TContext, TValidationError> {
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
> {
  public constructor(
    protected readonly _state: AppEndpointBuilderState<
      TContext,
      TRefinedContext,
      TValidationError
    >,
    protected readonly _methods: Set<TAllowedMethods>,
  ) {}

  public withoutBody<TOutput>(
    endpointHandler: (context: TRefinedContext) => TOutput,
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
    const handler: StaticAppEndpointBuilderSpec<TContext, TValidationError> = {
      outputValidation: outputSpec,
      builder: () => ({
        contextValidator: this._state.contextTransform.validator,
        handler: (ctx) =>
          postTransform(
            ctx,
            this._state.contextTransform,
            (transformedContext) =>
              validator(endpointHandler(transformedContext)),
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
> extends AppEndpointBuilderForMethods<
  TContext,
  TRefinedContext,
  TValidationError,
  TAllowedMethods
> {
  public withBody<THandlerResult, TBody>(
    {
      validator: inputValidator,
      ...inputSpec
    }: data.DataValidatorRequestInputSpec<TBody, TValidationError>,
    endpointHandler: (
      bodyData: TBody,
      context: TRefinedContext,
    ) => THandlerResult,
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
    const handler: StaticAppEndpointBuilderSpec<TContext, TValidationError> = {
      inputValidation: inputSpec,
      outputValidation: outputSpec,
      builder: () => ({
        contextValidator: this._state.contextTransform.validator,
        isBodyValid: inputValidator,
        handler: (ctx, body) =>
          postTransform(
            ctx,
            this._state.contextTransform,
            (transformedContext) =>
              outputValidator(
                endpointHandler(body as TBody, transformedContext),
              ),
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

const forMethodsImpl = <TMethods extends method.HttpMethod>(
  stateMethods: Record<string, unknown>,
  method: TMethods,
  methods: Array<TMethods>,
) => {
  const methodsSet = new Set([method, ...methods]);
  const overlappingMehods = new Set(
    Object.keys(stateMethods).filter((existingMethod) =>
      methodsSet.has(existingMethod as TMethods),
    ),
  );
  if (overlappingMehods.size > 0) {
    throw new Error(
      `The methods ${Array.from(overlappingMehods).join(
        ", ",
      )} are already specified`,
    );
  }
  return { methodsSet, withoutBody: method in HttpMethodsWithoutBody };
};

const checkMethodsForHandler = <TContext, TValidationError>(
  state: {
    [key: string]: StaticAppEndpointBuilderSpec<TContext, TValidationError>;
  },
  method: method.HttpMethod,
  groupNamePrefix: string,
  groups: Record<string, string>,
): ep.DynamicHandlerResponse<TContext, TValidationError> =>
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
) => {
  return (groupNamePrefix: string) =>
    new RegExp(
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

const postTransform = <TContext, TRefinedContext, TValidationError, TResult>(
  ctx: TContext,
  contextTransform: data.ContextValidatorSpec<
    TContext,
    TRefinedContext,
    TValidationError
  >,
  useTransformed: (transformed: TRefinedContext) => TResult,
) => {
  const transformedContext = contextTransform.validator(ctx);
  switch (transformedContext.error) {
    case "none":
      return useTransformed(transformedContext.data);
    default:
      return {
        error: "error" as const,
        errorInfo: transformedContext.errorInfo,
      };
  }
};
