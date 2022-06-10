import * as core from "../core";

import * as stream from "stream";
import * as u from "url";

export const checkURLPathNameForHandler = <TContext, TValidationError>(
  events:
    | Pick<
        RequestProcessingEvents<TContext, unknown, TValidationError>,
        "onInvalidUrl"
      >
    | undefined,
  ctx: TContext,
  url: u.URL | string,
  regExp: RegExp,
) => {
  const pathName = (url instanceof u.URL ? url : new u.URL(url)).pathname;
  const groups = regExp.exec(pathName)?.groups;
  if (!groups) {
    events?.onInvalidUrl?.({
      ctx,
      regExp,
    });
  }
  return groups
    ? {
        groups,
        eventArgs: {
          ctx,
          groups,
          regExp,
        },
      }
    : undefined;
};

export const checkMethodForHandler = <
  TContext,
  TRefinedContext,
  TValidationError,
>(
  events:
    | Pick<
        RequestProcessingEvents<TContext, unknown, TValidationError>,
        "onInvalidMethod"
      >
    | undefined,
  eventArgs: EventArguments<TContext>,
  groups: Record<string, string>,
  method: core.HttpMethod,
  handler: core.DynamicHandlerGetter<
    TContext,
    TRefinedContext,
    TValidationError
  >,
) => {
  const foundHandler = handler(method, groups);
  const foundSuccess = foundHandler.found === "handler";
  if (!foundSuccess) {
    events?.onInvalidMethod?.({
      ...eventArgs,
    });
  }
  return foundHandler;
};

export const checkContextForHandler = <
  TContext,
  TRefinedContext,
  TState,
  TValidationError,
>(
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidContext"
      >
    | undefined,
  eventArgs: EventArguments<TContext>,
  {
    validator,
    getState,
  }: core.StaticAppEndpointHandler<
    TContext,
    TRefinedContext,
    TValidationError
  >["contextValidator"],
) => {
  const validationResult = validator(eventArgs.ctx);
  let validatedContextOrError:
    | {
        result: "context";
        context: TRefinedContext;
        state: ReturnType<typeof getState>;
      }
    | {
        result: "error";
        customStatusCode: number | undefined;
        customBody: string | undefined;
      };
  if (validationResult.error === "none") {
    validatedContextOrError = {
      result: "context",
      context: validationResult.data,
      state: getState(validationResult.data),
    };
  } else {
    const isProtocolError = validationResult.error === "protocol-error";
    events?.onInvalidContext?.({
      ...eventArgs,
      validationError: isProtocolError ? undefined : validationResult.errorInfo,
    });
    validatedContextOrError = {
      result: "error",
      customStatusCode: isProtocolError
        ? validationResult.statusCode
        : undefined,
      customBody: isProtocolError ? validationResult.body : undefined,
    };
  }

  return validatedContextOrError;
};

export const checkURLParametersForHandler = <
  TContext,
  TState,
  TValidationError,
>(
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidUrlParameters"
      >
    | undefined,
  eventArgs: EventArgumentsWithState<TContext, TState>,
  groups: Record<string, string>,
  urlValidation: core.StaticAppEndpointHandler<
    TContext,
    unknown,
    TValidationError
  >["urlValidator"],
) => {
  let url: Record<string, unknown> | undefined;
  let proceedToInvokeHandler: boolean;
  if (urlValidation) {
    url = {};
    const errors: Array<TValidationError> = [];
    for (const [groupName, { parameterName, validator }] of Object.entries(
      urlValidation,
    )) {
      const validatorResult = validator(groups[groupName]);
      switch (validatorResult.error) {
        case "none":
          url[parameterName] = validatorResult.data;
          break;
        default:
          errors.push(validatorResult.errorInfo);
          break;
      }
    }
    proceedToInvokeHandler = errors.length === 0;
    if (!proceedToInvokeHandler) {
      events?.onInvalidUrlParameters?.({
        ...eventArgs,
        validationError: errors,
      });
    }
  } else {
    proceedToInvokeHandler = true;
  }
  return [proceedToInvokeHandler, url];
};

export const checkQueryForHandler = <TContext, TState, TValidationError>(
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidQuery"
      >
    | undefined,
  eventArgs: EventArgumentsWithState<TContext, TState>,
  queryValidation: core.StaticAppEndpointHandler<
    TContext,
    unknown,
    TValidationError
  >["queryValidator"],
  queryString: string,
  queryObject:
    | Record<string, string | Array<string> | undefined>
    | (() => TValidationError),
) => {
  let proceedToInvokeHandler: boolean;
  let query: unknown;
  if (queryValidation) {
    let queryValidationResult: core.DataValidatorResult<
      unknown,
      TValidationError
    >;
    switch (queryValidation.query) {
      case "string":
        queryValidationResult = queryValidation.validator(queryString);
        break;
      case "object":
        if (typeof queryObject === "function") {
          queryValidationResult = {
            error: "error",
            errorInfo: queryObject(),
          };
        } else {
          queryValidationResult = queryValidation.validator(queryObject);
        }
        break;
      default:
        throw new Error("Unrecognized query validation kind");
    }
    switch (queryValidationResult.error) {
      case "none":
        query = queryValidationResult.data;
        proceedToInvokeHandler = true;
        break;
      default:
        proceedToInvokeHandler = false;
        events?.onInvalidQuery?.({
          ...eventArgs,
          validationError: queryValidationResult.errorInfo,
        });
    }
  } else {
    // Only OK if query is none
    proceedToInvokeHandler = queryString.length === 0;
  }

  return [proceedToInvokeHandler, query];
};

export const checkBodyForHandler = async <TContext, TState, TValidationError>(
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidBody" | "onInvalidContentType"
      >
    | undefined,
  eventArgs: EventArgumentsWithState<TContext, TState>,
  isBodyValid: core.StaticAppEndpointHandler<
    TContext,
    unknown,
    TValidationError
  >["bodyValidator"],
  contentType: string,
  bodyStream: stream.Readable,
) => {
  let body: unknown;
  let proceedToInvokeHandler: boolean;
  if (isBodyValid) {
    const bodyValidationResult = await isBodyValid({
      contentType: contentType,
      input: bodyStream,
    });
    switch (bodyValidationResult.error) {
      case "none":
        body = bodyValidationResult.data;
        proceedToInvokeHandler = true;
        break;
      default:
        proceedToInvokeHandler = false;
        if (bodyValidationResult.error === "error") {
          events?.onInvalidBody?.({
            ...eventArgs,
            validationError: bodyValidationResult.errorInfo,
          });
        } else {
          events?.onInvalidContentType?.({
            ...eventArgs,
            contentType,
          });
        }
        break;
    }
  } else {
    // TODO should we only proceed if no body in context?
    proceedToInvokeHandler = true;
  }

  return [proceedToInvokeHandler, body];
};

export const invokeHandler = <
  TContext,
  TRefinedContext,
  TState,
  TValidationError,
>(
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidResponse"
      >
    | undefined,
  eventArgs: EventArgumentsWithState<TContext, TState>,
  handler: core.StaticAppEndpointHandler<
    TContext,
    TRefinedContext,
    TValidationError
  >["handler"],
  ...handlerParameters: Parameters<typeof handler>
) => {
  const retVal = handler(...handlerParameters);
  if (retVal.error !== "none") {
    events?.onInvalidResponse?.({
      ...eventArgs,
      validationError: retVal.errorInfo,
    });
  }
  return retVal;
};

export interface RequestProcessingEvents<TContext, TState, TValidationError> {
  // URL did not match combined regex
  onInvalidUrl?: (args: Omit<EventArguments<TContext>, "groups">) => unknown;
  onInvalidMethod?: (args: EventArguments<TContext>) => unknown;
  onInvalidContext?: (
    args: EventArguments<TContext> & {
      validationError: TValidationError | undefined;
    },
  ) => unknown;
  // URL matched combined regex, but parameter validation failed
  onInvalidUrlParameters?: (
    args: EventArgumentsWithState<TContext, TState> &
      ValidationErrorArgs<Array<TValidationError>>,
  ) => unknown;
  onInvalidQuery?: (
    args: EventArgumentsWithState<TContext, TState> &
      ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidContentType?: (
    args: EventArgumentsWithState<TContext, TState> & { contentType: string },
  ) => unknown;
  onInvalidBody?: (
    args: EventArgumentsWithState<TContext, TState> &
      ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidResponse?: (
    args: EventArgumentsWithState<TContext, TState> &
      ValidationErrorArgs<TValidationError>,
  ) => unknown;
}

export interface EventArguments<TContext> {
  ctx: TContext;
  groups: Record<string, string>;
  regExp: RegExp;
}

export interface EventArgumentsWithState<TContext, TState>
  extends EventArguments<TContext> {
  state: TState;
}

export interface ValidationErrorArgs<TValidationError> {
  validationError: TValidationError;
}
