import type * as method from "./methods";
import type * as data from "./data";

export interface AppEndpoint<
  TContext,
  TBodyValidationError,
  TMetadata extends Record<string, unknown>,
> {
  getRegExpAndHandler: (groupNamePrefix: string) => {
    url: RegExp;
    handler: DynamicHandlerGetter<TContext, TBodyValidationError>;
  };
  getMetadata: (urlPrefix: string) => {
    [P in keyof TMetadata]: Array<TMetadata[P]>;
  };
}

export type DynamicHandlerGetter<TContext, TBodyValidationError> = (
  method: method.HttpMethod,
  groups: Record<string, string>,
) => DynamicHandlerResponse<TContext, TBodyValidationError>;

export type DynamicHandlerResponse<TContext, TBodyValidationError> =
  | {
      found: "invalid-method";
      allowedMethods: Array<method.HttpMethod>;
    }
  | {
      found: "handler";
      handler: StaticAppEndpointHandler<TContext, TBodyValidationError>;
    };

export type StaticAppEndpointHandler<TContext, TBodyError> = {
  contextValidator: Pick<
    data.ContextValidatorSpec<TContext, unknown, unknown, TBodyError>,
    "validator" | "getState"
  >;
  urlValidator:
    | Record<
        string,
        {
          parameterName: string;
          validator: data.DataValidatorURL<unknown, TBodyError>;
        }
      >
    | undefined;
  queryValidator: data.QueryValidator<unknown, TBodyError> | undefined;
  bodyValidator?: data.DataValidatorRequestInput<unknown, TBodyError>;
  handler: StaticAppEndpointHandlerFunction<TContext, TBodyError>;
};

export type StaticAppEndpointHandlerFunction<TContext, TBodyError> = (args: {
  context: TContext;
  state: unknown;
  url: unknown;
  query: unknown;
  body: unknown;
}) => data.DataValidatorResult<
  data.DataValidatorResponseOutputSuccess,
  TBodyError
>;
