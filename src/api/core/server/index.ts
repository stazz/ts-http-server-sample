import * as core from "../core";

import * as stream from "stream";
import * as q from "querystring";
import * as u from "url";

export const checkURLPathNameForHandler = <TValidationError, TContext>(
  events:
    | Pick<RequestProcessingEvents<TValidationError, TContext>, "onInvalidUrl">
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
  TValidationError,
  TContext,
  TRefinedContext,
>(
  events:
    | Pick<
        RequestProcessingEvents<TValidationError, TContext>,
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
  TValidationError,
  TContext,
  TRefinedContext,
>(
  events:
    | Pick<
        RequestProcessingEvents<TValidationError, TContext>,
        "onInvalidContext"
      >
    | undefined,
  eventArgs: EventArguments<TContext>,
  contextValidation: core.StaticAppEndpointHandler<
    TContext,
    TRefinedContext,
    TValidationError
  >["contextValidator"],
) => {
  const validationResult = contextValidation(eventArgs.ctx);
  let validatedContextOrError:
    | {
        result: "context";
        context: TRefinedContext;
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
    };
  } else {
    events?.onInvalidContext?.({
      ...eventArgs,
      validationError: validationResult.errorInfo,
    });
    validatedContextOrError = {
      result: "error",
      customStatusCode: undefined, // TODO get it from validationResult
      customBody: undefined, // TODO get it from validationResult
    };
  }

  return validatedContextOrError;
};

export const checkURLParametersForHandler = <TValidationError, TContext>(
  events:
    | Pick<
        RequestProcessingEvents<TValidationError, TContext>,
        "onInvalidUrlParameters"
      >
    | undefined,
  eventArgs: EventArguments<TContext>,
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

export const checkQueryForHandler = <TValidationError, TContext>(
  events:
    | Pick<
        RequestProcessingEvents<TValidationError, TContext>,
        "onInvalidQuery"
      >
    | undefined,
  eventArgs: EventArguments<TContext>,
  queryValidation: core.StaticAppEndpointHandler<
    TContext,
    unknown,
    TValidationError
  >["queryValidator"],
  queryString: string,
  queryObject: q.ParsedUrlQuery | (() => TValidationError),
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

export const checkBodyForHandler = async <TValidationError, TContext>(
  events:
    | Pick<
        RequestProcessingEvents<TValidationError, TContext>,
        "onInvalidBody" | "onInvalidContentType"
      >
    | undefined,
  eventArgs: EventArguments<TContext>,
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

export const invokeHandler = <TValidationError, TContext, TRefinedContext>(
  events:
    | Pick<
        RequestProcessingEvents<TValidationError, TContext>,
        "onInvalidResponse"
      >
    | undefined,
  eventArgs: EventArguments<TContext>,
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

export interface RequestProcessingEvents<TValidationError, TContext> {
  // URL did not match combined regex
  onInvalidUrl?: (args: Omit<EventArguments<TContext>, "groups">) => unknown;
  onInvalidMethod?: (args: EventArguments<TContext>) => unknown;
  onInvalidContext?: (
    args: EventArguments<TContext> & ValidationErrorArgs<TValidationError>,
  ) => unknown;
  // URL matched combined regex, but parameter validation failed
  onInvalidUrlParameters?: (
    args: EventArguments<TContext> &
      ValidationErrorArgs<Array<TValidationError>>,
  ) => unknown;
  onInvalidQuery?: (
    args: EventArguments<TContext> & ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidContentType?: (
    args: EventArguments<TContext> & { contentType: string },
  ) => unknown;
  onInvalidBody?: (
    args: EventArguments<TContext> & ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidResponse?: (
    args: EventArguments<TContext> & ValidationErrorArgs<TValidationError>,
  ) => unknown;
}

export interface EventArguments<TContext> {
  ctx: TContext;
  groups: Record<string, string>;
  regExp: RegExp;
}

export interface ValidationErrorArgs<TValidationError> {
  validationError: TValidationError;
}
