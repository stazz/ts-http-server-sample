import * as utils from "./utils";
import * as url from "./url";
import * as data from "./data";
import * as ep from "./endpoint";

export const bindNecessaryTypes = <
  TValidationError,
  TContext,
>(): AppEndpointBuilderProvider<TValidationError, TContext> => ({
  atURL: (<TArgs extends Array<string>>(
    fragments: TemplateStringsArray,
    ...args: TArgs
  ):
    | URLDataNames<TValidationError, TContext, TArgs[number]>
    | AppEndpointBuilder<TValidationError, TContext, Record<string, never>> =>
    atURL(fragments, args)) as AppEndpointBuilderProvider<
    TValidationError,
    TContext
  >["atURL"],
});

export type AppEndpointBuilderProvider<TValidationError, TContext> = {
  atURL: ((
    fragments: TemplateStringsArray,
  ) => AppEndpointBuilder<TValidationError, TContext, Record<string, never>>) &
    (<TArgs extends [string, ...Array<string>]>(
      fragments: TemplateStringsArray,
      ...args: TArgs
    ) => URLDataNames<TValidationError, TContext, TArgs[number]>);
};

const atURL = <TValidationError, TContext, TArgs extends Array<string>>(
  fragments: TemplateStringsArray,
  args: TArgs,
):
  | URLDataNames<TValidationError, TContext, TArgs[number]>
  | AppEndpointBuilder<TValidationError, TContext, Record<string, never>> => {
  return args.length > 0
    ? // URL template has arguments -> return URL data validator which allows to build endpoints
      {
        validateURLData: (validation) => {
          const urlRegExp = buildURLRegExp(fragments, args, validation);
          return {
            withoutBody: (handler, transformOutput, ...methods) => ({
              methods: getMethodsWithoutBody(methods),
              getRegExpAndHandler: (groupNamePrefix) => ({
                url: urlRegExp(groupNamePrefix),
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
                url: urlRegExp(groupNamePrefix),
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
};

const getMethodsWithoutBody = (
  methods: ReadonlyArray<ep.HttpMethod>,
): ReadonlyArray<ep.HttpMethod> =>
  methods.length <= 0 ? ["GET"] : [...methods];

const getMethodsWithBody = (
  methods: ReadonlyArray<ep.HttpMethod>,
): ReadonlyArray<ep.HttpMethod> =>
  methods.length <= 0 ? ["POST"] : [...methods];

export interface URLDataNames<
  TValidationError,
  TContext,
  TNames extends string,
> {
  validateURLData: <TValidation extends URLNamedDataValidation<TNames>>(
    validation: TValidation,
  ) => AppEndpointBuilder<
    TValidationError,
    TContext,
    {
      [P in TNames]: ReturnType<TValidation[P]["transform"]>;
    }
  >;
}

export type URLNamedDataValidation<TNames extends PropertyKey> = Record<
  TNames,
  url.URLDataTransformer<unknown>
>;

export interface AppEndpointBuilder<TValidationError, TContext, T> {
  withoutBody: <U, TOutput>(
    handler: (urlData: T, context: TContext) => U,
    transformOutput: data.DataValidatorOutput<TOutput, TValidationError, U>,
    ...httpMethods: Array<ep.HttpMethod>
  ) => ep.AppEndpoint<
    TContext,
    TValidationError,
    TOutput,
    ep.AppEndpointHandlerWithoutBody<TContext, TValidationError, TOutput>
  >;
  withBody: <U, V, TOutput>(
    bodyDataValidator: data.DataValidatorInput<V, TValidationError>,
    handler: (urlData: T, bodyData: V, context: TContext) => U,
    transformOutput: data.DataValidatorOutput<TOutput, TValidationError, U>,
    ...httpMethods: Array<HttpMethodWithBody>
  ) => ep.AppEndpoint<
    TContext,
    TValidationError,
    TOutput,
    ep.AppEndpointHandlerWithBody<TContext, TValidationError, TOutput>
  >;
}

export type HttpMethodWithBody = Exclude<ep.HttpMethod, "GET">;

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
