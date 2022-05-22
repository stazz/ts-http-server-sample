import * as utils from "./utils";

export type HttpMethod = HttpMethodNoBody | HttpMethodWithBody;
export type HttpMethodNoBody = "GET";
export type HttpMethodWithBody = "POST" | "PUT" | "DELETE"; // And others...

export function atURL(
  fragments: TemplateStringsArray,
): AppEndpointBuilder<Record<string, never>>;
export function atURL<TArgs extends [string, ...Array<string>]>(
  fragments: TemplateStringsArray,
  ...args: TArgs
): URLDataNames<TArgs[number]>;
export function atURL<TArgs extends Array<string>>(
  fragments: TemplateStringsArray,
  ...args: TArgs
): URLDataNames<TArgs[number]> | AppEndpointBuilder<Record<string, never>> {
  return args.length > 0
    ? // URL template has arguments -> return URL data validator which allows to build endpoints
      {
        validateURLData: (validation) => {
          const url = buildURLRegExp(fragments, args, validation);
          return {
            withoutBody: (handler, transformOutput, ...methods) => ({
              methods: getMethodsWithoutBody(methods),
              getRegExpAndHandler: (groupNamePrefix) => ({
                url: url(groupNamePrefix),
                handler: {
                  body: "none",
                  handler: (context, groups) =>
                    transformOutput(
                      handler(
                        buildURLDataObject(
                          args,
                          validation,
                          groups,
                          groupNamePrefix,
                        ) as unknown as Parameters<typeof handler>[0],
                        context,
                      ),
                    ),
                },
              }),
            }),
            withBody: (
              bodyDataValidator,
              handler,
              transformOutput,
              ...methods
            ) => ({
              methods: getMethodsWithBody(methods),
              getRegExpAndHandler: (groupNamePrefix) => ({
                url: url(groupNamePrefix),
                handler: {
                  body: "required",
                  isBodyValid: bodyDataValidator,
                  handler: (body, context, groups) =>
                    transformOutput(
                      handler(
                        buildURLDataObject(
                          args,
                          validation,
                          groups,
                          groupNamePrefix,
                        ) as unknown as Parameters<typeof handler>[0],
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                        body as any,
                        context,
                      ),
                    ),
                },
              }),
            }),
          };
        },
      }
    : // URL has no arguments -> return builder which can build endpoints without URL validation
      {
        withoutBody: (handler, transformOutput, ...methods) => ({
          methods: getMethodsWithoutBody(methods),
          getRegExpAndHandler: () => {
            return {
              url: new RegExp(utils.escapeRegExp(fragments.join(""))),
              handler: {
                body: "none",
                handler: (ctx) => transformOutput(handler({}, ctx)),
              },
            };
          },
        }),
        withBody: (
          bodyDataValidator,
          handler,
          transformOutput,
          ...methods
        ) => ({
          methods: getMethodsWithBody(methods),
          getRegExpAndHandler: () => {
            return {
              url: new RegExp(utils.escapeRegExp(fragments.join(""))),
              handler: {
                body: "required",
                isBodyValid: bodyDataValidator,
                handler: (body, ctx) =>
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                  transformOutput(handler({}, body as any, ctx)),
              },
            };
          },
        }),
      };
}

const getMethodsWithoutBody = (
  methods: ReadonlyArray<HttpMethod>,
): ReadonlyArray<HttpMethod> => (methods.length <= 0 ? ["GET"] : [...methods]);

const getMethodsWithBody = (
  methods: ReadonlyArray<HttpMethod>,
): ReadonlyArray<HttpMethod> => (methods.length <= 0 ? ["POST"] : [...methods]);

export interface URLDataNames<TNames extends string> {
  validateURLData: <TValidation extends URLNamedDataValidation<TNames>>(
    validation: TValidation,
  ) => AppEndpointBuilder<{
    [P in TNames]: ReturnType<TValidation[P]["transform"]>;
  }>;
}

export type URLNamedDataValidation<TNames extends PropertyKey> = Record<
  TNames,
  URLDataTransformer<unknown>
>;

export interface URLDataTransformer<T> {
  regexp: RegExp;
  transform: (
    matchedString: string,
    /* later - groups: Array<string> */
  ) => T;
}

export interface AppEndpointBuilder<T> {
  withoutBody: <U, TOutput, TContext = unknown>(
    handler: (urlData: T, context: TContext) => U,
    transformOutput: (this: void, output: U) => TOutput,
    ...httpMethods: Array<HttpMethod>
  ) => AppEndpoint<TContext, AppEndpointHandlerWithoutBody<TContext>>;
  withBody: <U, V, TOutput, TContext = unknown>(
    bodyDataValidator: (data: unknown) => data is V,
    handler: (urlData: T, bodyData: V, context: TContext) => U,
    transformOutput: (this: void, output: U) => TOutput,
    ...httpMethods: Array<HttpMethodWithBody>
  ) => AppEndpoint<TContext, AppEndpointHandlerWithBody<TContext>>;
}

export type BodyDataValidator<TData, TError> = (data: unknown) =>
  | {
      error: "none";
      data: TData;
    }
  | {
      error: "error";
      errorInfo: TError;
    };

const DEFAULT_PARAM_REGEXP = /[^/]+/;
export function defaultParameter(): URLDataTransformer<string>;
export function defaultParameter<T>(
  transform: (matchedString: string) => T,
): URLDataTransformer<T>;
export function defaultParameter<T>(
  transform?: (matchedString: string) => T,
): URLDataTransformer<T> {
  return {
    regexp: DEFAULT_PARAM_REGEXP,
    transform: transform ?? ((str) => str as unknown as T),
  };
}

export function regexpParameter(
  regexp: URLDataTransformer<string>["regexp"],
): URLDataTransformer<string>;
export function regexpParameter<T>(
  regexp: URLDataTransformer<T>["regexp"],
  transform: URLDataTransformer<T>["transform"],
): URLDataTransformer<T>;
export function regexpParameter<T>(
  regexp: URLDataTransformer<T>["regexp"],
  transform?: URLDataTransformer<T>["transform"],
): URLDataTransformer<T> {
  return {
    regexp,
    transform: transform ?? ((str) => str as unknown as T),
  };
}

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

export interface AppEndpoint<
  TContext,
  THandler =
    | AppEndpointHandlerWithoutBody<TContext>
    | AppEndpointHandlerWithBody<TContext>
    | DynamicHandlerGetter<TContext>,
> {
  methods: ReadonlyArray<HttpMethod>;
  getRegExpAndHandler: (groupNamePrefix: string) => {
    url: RegExp;
    handler: THandler;
  };
}

export type DynamicHandlerGetter<TContext> = (
  method: HttpMethod,
  groups: Record<string, string>,
) => DynamicHandlerResponse<TContext>;

export type AppEndpointHandlerWithoutBody<TContext> = {
  body: "none";
  handler: (context: TContext, groups: Record<string, string>) => unknown;
};

export type AppEndpointHandlerWithBody<TContext> = {
  body: "required";
  isBodyValid: (this: void, body: unknown) => boolean;
  handler: (
    body: unknown,
    ...args: Parameters<AppEndpointHandlerWithoutBody<TContext>["handler"]>
  ) => unknown;
};

export type DynamicHandlerResponse<TContext> =
  | {
      found: "invalid-method";
      allowedMethods: Array<HttpMethod>;
    }
  | {
      found: "handler";
      handler:
        | AppEndpointHandlerWithoutBody<TContext>
        | AppEndpointHandlerWithBody<TContext>;
    };

// For example, from URL string "/api/${id}" and the id parameter adhering to regexp X, build regexp:
// "/api/(?<ep_prefix_id>X)"
// Don't add start/end marks ^/$, since we want to allow prefixing URLs.
const buildURLRegExp = (
  fragments: TemplateStringsArray,
  names: ReadonlyArray<string>,
  validation: Record<string, URLDataTransformer<unknown>>,
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
