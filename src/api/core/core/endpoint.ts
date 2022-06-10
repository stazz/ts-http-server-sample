import * as method from "./methods";
import * as data from "./data";
import * as context from "./context";

export interface AppEndpointFunctionality<
  TContext,
  TRefinedContext,
  TBodyValidationError,
> {
  getRegExpAndHandler: (groupNamePrefix: string) => {
    url: RegExp;
    handler: DynamicHandlerGetter<
      TContext,
      TRefinedContext,
      TBodyValidationError
    >;
  };
}

export interface AppEndpoint<
  TContext,
  TRefinedContext,
  TBodyValidationError,
  TMetadata extends Record<string, unknown>,
> extends AppEndpointFunctionality<
    TContext,
    TRefinedContext,
    TBodyValidationError
  > {
  getMetadata: (urlPrefix: string) => {
    [P in keyof TMetadata]: Array<TMetadata[P]>;
  };
}

export type DynamicHandlerGetter<
  TContext,
  TRefinedContext,
  TBodyValidationError,
> = (
  method: method.HttpMethod,
  groups: Record<string, string>,
) => DynamicHandlerResponse<TContext, TRefinedContext, TBodyValidationError>;

export type DynamicHandlerResponse<
  TContext,
  TRefinedContext,
  TBodyValidationError,
> =
  | {
      found: "invalid-method";
      allowedMethods: Array<method.HttpMethod>;
    }
  | {
      found: "handler";
      handler: StaticAppEndpointHandler<
        TContext,
        TRefinedContext,
        TBodyValidationError
      >;
    };

export type StaticAppEndpointHandler<TContext, TRefinedContext, TBodyError> = {
  contextValidator: Pick<
    context.ContextValidatorSpec<
      TContext,
      TRefinedContext,
      unknown,
      TBodyError
    >,
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
  handler: StaticAppEndpointHandlerFunction<TRefinedContext, TBodyError>;
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
