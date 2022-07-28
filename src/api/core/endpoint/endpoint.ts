import type * as method from "./methods";
import type * as data from "../data-server";

export interface AppEndpoint<
  TContext,
  TMetadata extends Record<string, unknown>,
> {
  getRegExpAndHandler: (groupNamePrefix: string) => {
    url: RegExp;
    handler: DynamicHandlerGetter<TContext>;
  };
  getMetadata: (urlPrefix: string) => {
    [P in keyof TMetadata]: Array<TMetadata[P]>;
  };
}

export type DynamicHandlerGetter<TContext> = (
  method: method.HttpMethod,
  groups: Record<string, string | undefined>,
) => DynamicHandlerResponse<TContext>;

export type DynamicHandlerResponse<TContext> =
  | {
      found: "invalid-method";
      allowedMethods: Array<method.HttpMethod>;
    }
  | {
      found: "handler";
      handler: StaticAppEndpointHandler<TContext>;
    };

export type StaticAppEndpointHandler<TContext> = {
  contextValidator: Pick<
    data.ContextValidatorSpec<TContext, unknown, unknown>,
    "validator" | "getState"
  >;
  urlValidator:
    | Record<
        string,
        {
          parameterName: string;
          validator: data.DataValidatorURL<unknown>;
        }
      >
    | undefined;
  headerValidator:
    | data.HeaderDataValidators<Record<string, unknown>>
    | undefined;
  queryValidator: data.QueryValidator<unknown> | undefined;
  bodyValidator?: data.DataValidatorRequestInput<unknown>;
  handler: StaticAppEndpointHandlerFunction<TContext>;
};

export type StaticAppEndpointHandlerFunction<TContext> = (args: {
  context: TContext;
  state: unknown;
  url: unknown;
  headers: Record<string, string | Array<string>>;
  query: unknown;
  body: unknown;
}) => MaybePromise<
  data.DataValidatorResult<data.DataValidatorResponseOutputSuccess>
>;

export type MaybePromise<T> = T | Promise<T>;

// TODO This is not optimal solution.
// Refactor when issue #16 gets addressed.
export const withCORSOptions = <
  TContext,
  TMetadata extends Record<string, unknown>,
>(
  ep: AppEndpoint<TContext, TMetadata>,
  { origin, allowHeaders }: CORSOptions,
): AppEndpoint<TContext, TMetadata> => ({
  getRegExpAndHandler: (groupNamePrefix) => {
    const { handler, ...retVal } = ep.getRegExpAndHandler(groupNamePrefix);
    return {
      ...retVal,
      handler: (method, groups) => {
        let handlerResult = handler(method, groups);
        if (handlerResult.found === "invalid-method" && method === "OPTIONS") {
          handlerResult = {
            found: "handler",
            handler: {
              contextValidator: {
                validator: (ctx) => ({
                  error: "none",
                  data: ctx,
                }),
                getState: () => undefined,
              },
              urlValidator: undefined,
              queryValidator: undefined,
              headerValidator: undefined,
              handler: () => ({
                error: "none",
                data: {
                  output: undefined,
                  contentType: "will-not-be-used",
                  headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Headers":
                      typeof allowHeaders === "string"
                        ? allowHeaders
                        : allowHeaders.join(","),
                  },
                },
              }),
            },
          };
        } else if (handlerResult.found === "handler") {
          const { handler: requestHandler, ...rest } = handlerResult.handler;
          handlerResult = {
            found: "handler",
            handler: {
              ...rest,
              handler: async (args) => {
                const result = await requestHandler(args);
                if (result.error === "none") {
                  result.data.headers = Object.assign(
                    {
                      "Access-Control-Allow-Origin": origin,
                    },
                    result.data.headers ?? {},
                  );
                }

                return result;
              },
            },
          };
        }
        return handlerResult;
      },
    };
  },
  getMetadata: (urlPrefix) => ep.getMetadata(urlPrefix),
});

export interface CORSOptions {
  origin: string;
  allowHeaders: string | Array<string>;
  // TODO allow methods, etc
}
