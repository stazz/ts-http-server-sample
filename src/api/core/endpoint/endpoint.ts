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
  groups: Record<string, string>,
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
  queryValidator: data.QueryValidator<unknown> | undefined;
  bodyValidator?: data.DataValidatorRequestInput<unknown>;
  handler: StaticAppEndpointHandlerFunction<TContext>;
};

export type StaticAppEndpointHandlerFunction<TContext> = (args: {
  context: TContext;
  state: unknown;
  url: unknown;
  query: unknown;
  body: unknown;
}) => data.DataValidatorResult<data.DataValidatorResponseOutputSuccess>;
