import * as data from "./data";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"; // And others...

export interface AppEndpoint<
  TContext,
  TBodyValidationError,
  THandler =
    | AppEndpointHandlerWithoutBody<TContext, TBodyValidationError>
    | AppEndpointHandlerWithBody<TContext, TBodyValidationError>
    | DynamicHandlerGetter<TContext, TBodyValidationError>,
> {
  methods: ReadonlyArray<HttpMethod>;
  getRegExpAndHandler: (groupNamePrefix: string) => {
    url: RegExp;
    handler: THandler;
  };
}

export type DynamicHandlerGetter<TContext, TBodyValidationError> = (
  method: HttpMethod,
  groups: Record<string, string>,
) => DynamicHandlerResponse<TContext, TBodyValidationError>;

export type AppEndpointHandlerWithoutBody<TContext, TValidationError> = {
  body: "none";
  handler: (
    context: TContext,
    groups: Record<string, string>,
  ) => data.DataValidatorResponseOutput<unknown, TValidationError>;
};

export type AppEndpointHandlerWithBody<TContext, TBodyError> = {
  body: "required";
  isBodyValid: data.DataValidatorInput<unknown, TBodyError>;
  handler: (
    body: unknown,
    ...args: Parameters<
      AppEndpointHandlerWithoutBody<TContext, TBodyError>["handler"]
    >
  ) => data.DataValidatorResponseOutput<unknown, TBodyError>;
};

export type DynamicHandlerResponse<TContext, TBodyValidationError> =
  | {
      found: "invalid-method";
      allowedMethods: Array<HttpMethod>;
    }
  | {
      found: "handler";
      handler:
        | AppEndpointHandlerWithoutBody<TContext, TBodyValidationError>
        | AppEndpointHandlerWithBody<TContext, TBodyValidationError>;
    };
