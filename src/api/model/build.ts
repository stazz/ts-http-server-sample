import * as utils from "./utils";
import * as url from "./url";
import * as data from "./data";
import * as ep from "./endpoint";

export const bindNecessaryTypes = <
  TContext,
  TValidationError,
>(): AppEndpointBuilderProvider<TContext, TValidationError> => ({
  atURL: (<TArgs extends Array<string>>(
    fragments: TemplateStringsArray,
    ...args: TArgs
  ):
    | URLDataNames<TContext, TValidationError, TArgs[number]>
    | AppEndpointBuilder<TContext, TValidationError, Record<string, never>> =>
    atURL(fragments, args)) as AppEndpointBuilderProvider<
    TContext,
    TValidationError
  >["atURL"],
});

export type AppEndpointBuilderProvider<TContext, TValidationError> = {
  atURL: ((
    fragments: TemplateStringsArray,
  ) => AppEndpointBuilder<TContext, TValidationError, Record<string, never>>) &
    (<TArgs extends [string, ...Array<string>]>(
      fragments: TemplateStringsArray,
      ...args: TArgs
    ) => URLDataNames<TContext, TValidationError, TArgs[number]>);
};

const atURL = <TContext, TValidationError, TArgs extends Array<string>>(
  fragments: TemplateStringsArray,
  args: TArgs,
):
  | URLDataNames<TContext, TValidationError, TArgs[number]>
  | AppEndpointBuilder<TContext, TValidationError, Record<string, never>> => {
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
  TContext,
  TValidationError,
  TNames extends string,
> {
  validateURLData: <TValidation extends URLNamedDataValidation<TNames>>(
    validation: TValidation,
  ) => AppEndpointBuilder<
    TContext,
    TValidationError,
    {
      [P in TNames]: ReturnType<TValidation[P]["transform"]>;
    }
  >;
}

export type URLNamedDataValidation<TNames extends PropertyKey> = Record<
  TNames,
  url.URLDataTransformer<unknown>
>;

export interface AppEndpointBuilder<
  TContext,
  TValidationError,
  TDataInURL,
  TAllowedMethods extends ep.HttpMethod = ep.HttpMethod,
> {
  withoutBody: <U, TOutput>(
    handler: (urlData: TDataInURL, context: TContext) => U,
    transformOutput: data.DataValidatorOutput<TOutput, TValidationError, U>,
    ...httpMethods: Array<TAllowedMethods>
  ) => ep.AppEndpoint<
    TContext,
    TValidationError,
    ep.AppEndpointHandlerWithoutBody<TContext, TValidationError>
  >;
  withBody: <U, V, TOutput>(
    bodyDataValidator: data.DataValidatorInput<V, TValidationError>,
    handler: (urlData: TDataInURL, bodyData: V, context: TContext) => U,
    transformOutput: data.DataValidatorOutput<TOutput, TValidationError, U>,
    ...httpMethods:
      | [
          TAllowedMethods & HttpMethodWithoutBody,
          TAllowedMethods & HttpMethodWithBody,
          ...Array<TAllowedMethods & HttpMethodWithBody>,
        ]
      | [
          TAllowedMethods & HttpMethodWithBody,
          ...Array<TAllowedMethods & HttpMethodWithBody>,
        ]
  ) => ep.AppEndpoint<
    TContext,
    TValidationError,
    ep.AppEndpointHandlerWithBody<TContext, TValidationError>
  >;
}

export type HttpMethodWithoutBody = ep.HttpMethod & "GET";
export type HttpMethodWithBody = Exclude<ep.HttpMethod, HttpMethodWithoutBody>;

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
