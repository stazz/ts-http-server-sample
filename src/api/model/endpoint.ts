import * as data from "./data";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"; // And others...

export interface AppEndpoint<TContext, TBodyValidationError> {
  //methods: ReadonlyArray<HttpMethod>;
  getRegExpAndHandler: (groupNamePrefix: string) => {
    url: RegExp;
    handler: DynamicHandlerGetter<TContext, TBodyValidationError>;
  };
}

export type DynamicHandlerGetter<TContext, TBodyValidationError> = (
  method: HttpMethod,
  groups: Record<string, string>,
) => DynamicHandlerResponse<TContext, TBodyValidationError>;

export type StaticAppEndpointHandler<TContext, TBodyError> = {
  isBodyValid?: data.DataValidatorInput<unknown, TBodyError>;
  handler: (
    context: TContext,
    body: unknown,
  ) => data.DataValidatorResponseOutput<unknown, TBodyError>;
};

export type DynamicHandlerResponse<TContext, TBodyValidationError> =
  | {
      found: "invalid-method";
      allowedMethods: Array<HttpMethod>;
    }
  | {
      found: "handler";
      handler: StaticAppEndpointHandler<TContext, TBodyValidationError>;
    };
