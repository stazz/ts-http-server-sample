import * as method from "./method";
import * as data from "./data";

export interface AppEndpoint<TContext, TBodyValidationError> {
  getRegExpAndHandler: (groupNamePrefix: string) => {
    url: RegExp;
    handler: DynamicHandlerGetter<TContext, TBodyValidationError>;
  };
  // metadata: ReadonlyArray<AppEndpointMetadata>
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
  isBodyValid?: data.DataValidatorRequestInput<unknown, TBodyError>;
  handler: StaticAppEndpointHandlerFunction<TContext, TBodyError>;
  contextValidator: data.ContextValidator<TContext, unknown, TBodyError>;
};

export type StaticAppEndpointHandlerFunction<TContext, TBodyError> = (
  context: TContext,
  body: unknown,
) => data.DataValidatorResult<
  data.DataValidatorResponseOutputSuccess,
  TBodyError
>;
