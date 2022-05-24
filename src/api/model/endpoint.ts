import * as data from "./data";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"; // And others...

export interface AppEndpoint<
  TContext,
  TBodyValidationError,
  TOutput = unknown,
  THandler =
    | AppEndpointHandlerWithoutBody<TContext, TBodyValidationError, TOutput>
    | AppEndpointHandlerWithBody<TContext, TBodyValidationError, TOutput>
    | DynamicHandlerGetter<TContext, TBodyValidationError, TOutput>,
> {
  methods: ReadonlyArray<HttpMethod>;
  getRegExpAndHandler: (groupNamePrefix: string) => {
    url: RegExp;
    handler: THandler;
  };
}

export type DynamicHandlerGetter<TContext, TBodyValidationError, TOutput> = (
  method: HttpMethod,
  groups: Record<string, string>,
) => DynamicHandlerResponse<TContext, TBodyValidationError, TOutput>;

export type AppEndpointHandlerWithoutBody<TContext, TValidationError, TOutput> =
  {
    body: "none";
    handler: (
      context: TContext,
      groups: Record<string, string>,
    ) => data.DataValidatorResponseOutput<TOutput, TValidationError>;
  };

export type AppEndpointHandlerWithBody<TContext, TBodyError, TOutput> = {
  body: "required";
  isBodyValid: data.DataValidatorInput<unknown, TBodyError>;
  handler: (
    body: unknown,
    ...args: Parameters<
      AppEndpointHandlerWithoutBody<TContext, TBodyError, TOutput>["handler"]
    >
  ) => data.DataValidatorResponseOutput<TOutput, TBodyError>;
};

export type DynamicHandlerResponse<TContext, TBodyValidationError, TOutput> =
  | {
      found: "invalid-method";
      allowedMethods: Array<HttpMethod>;
    }
  | {
      found: "handler";
      handler:
        | AppEndpointHandlerWithoutBody<TContext, TBodyValidationError, TOutput>
        | AppEndpointHandlerWithBody<TContext, TBodyValidationError, TOutput>;
    };
