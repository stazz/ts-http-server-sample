import * as method from "./method";
import * as data from "./data";

export interface AppEndpoint<TContext, TRefinedContext, TBodyValidationError> {
  getRegExpAndHandler: (groupNamePrefix: string) => {
    url: RegExp;
    handler: DynamicHandlerGetter<
      TContext,
      TRefinedContext,
      TBodyValidationError
    >;
  };
  // metadata: ReadonlyArray<AppEndpointMetadata>
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
  contextValidator: data.ContextValidator<
    TContext,
    TRefinedContext,
    TBodyError
  >;
  urlValidator?: Record<
    string,
    {
      parameterName: string;
      validator: data.DataValidatorURL<unknown, TBodyError>;
    }
  >;
  queryValidator: data.QueryValidator<unknown, TBodyError> | undefined;
  bodyValidator?: data.DataValidatorRequestInput<unknown, TBodyError>;
  handler: StaticAppEndpointHandlerFunction<TRefinedContext, TBodyError>;
};

export type StaticAppEndpointHandlerFunction<TContext, TBodyError> = (args: {
  context: TContext;
  url: unknown;
  query: unknown;
  body: unknown;
}) => data.DataValidatorResult<
  data.DataValidatorResponseOutputSuccess,
  TBodyError
>;

// export interface EndpointHandlerArgs<TContext> {
//   context: TContext;
// }

// export interface EndpointHandlerArgsWithURL<TDataInURL> {
//   url: TDataInURL;
// }

// export interface EndpointHandlerArgsWithBody<TBody> {
//   body: TBody;
// }

// export type EndpointHandler<TArgs, THandlerResult> = (
//   args: TArgs,
// ) => THandlerResult;
