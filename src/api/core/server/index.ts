import * as core from "../core";

import * as stream from "stream";
import * as u from "url";

// Higher-kinded-type trick from: https://www.matechs.com/blog/encoding-hkts-in-typescript-once-again
export interface HKTContext {
  readonly _TState?: unknown;
  readonly type?: unknown;
}

export type HKTContextKind<F extends HKTContext, TState> = F extends {
  readonly type: unknown;
}
  ? (F & {
      readonly _TState: TState;
    })["type"]
  : never; // This is simplified version from original HKT pattern in the link, because we don't use the functional properties of this specific HKT.

export type ContextValidatorFactory<TContext extends HKTContext> = <
  TInput,
  TData,
  TError,
>(
  validator: core.DataValidator<TInput, TData, TError>,
  protocolErrorInfo?:
    | number
    | {
        statusCode: number;
        body: string | undefined;
      },
) => core.ContextValidatorSpec<
  HKTContextKind<TContext, TInput>,
  HKTContextKind<TContext, TData>,
  TData,
  TError
>;

export const checkURLPathNameForHandler = <TContext, TState>(
  ctx: TContext,
  state: TState,
  events:
    | Pick<RequestProcessingEvents<TContext, TState, unknown>, "onInvalidUrl">
    | undefined,
  url: u.URL | string,
  regExp: RegExp,
) => {
  const pathName = (url instanceof u.URL ? url : new u.URL(url)).pathname;
  const groups = regExp.exec(pathName)?.groups;
  if (!groups) {
    events?.onInvalidUrl?.({
      ctx,
      state,
      regExp,
    });
  }
  return groups
    ? {
        ctx,
        state,
        groups,
        regExp,
      }
    : undefined;
};

export const checkMethodForHandler = <TContext, TState, TValidationError>(
  eventArgs: EventArguments<TContext, TState>,
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidMethod"
      >
    | undefined,
  method: core.HttpMethod,
  handler: core.DynamicHandlerGetter<TContext, TValidationError>,
) => {
  const foundHandler = handler(method, eventArgs.groups);
  const foundSuccess = foundHandler.found === "handler";
  if (!foundSuccess) {
    events?.onInvalidMethod?.({
      ...eventArgs,
    });
  }
  return foundHandler;
};

export const checkContextForHandler = <TContext, TState, TValidationError>(
  eventArgs: EventArguments<TContext, TState>,
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidContext"
      >
    | undefined,
  {
    validator,
    getState,
  }: core.StaticAppEndpointHandler<
    TContext,
    TValidationError
  >["contextValidator"],
) => {
  const validationResult = validator(eventArgs.ctx);
  let validatedContextOrError:
    | {
        result: "context";
        context: unknown;
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
  eventArgs: EventArguments<TContext, TState>,
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidUrlParameters"
      >
    | undefined,
  urlValidation: core.StaticAppEndpointHandler<
    TContext,
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
      const validatorResult = validator(eventArgs.groups[groupName]);
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
  eventArgs: EventArguments<TContext, TState>,
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidQuery"
      >
    | undefined,
  queryValidation: core.StaticAppEndpointHandler<
    TContext,
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
  eventArgs: EventArguments<TContext, TState>,
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidBody" | "onInvalidContentType"
      >
    | undefined,
  isBodyValid: core.StaticAppEndpointHandler<
    TContext,
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

export const invokeHandler = <TContext, TState, TValidationError>(
  eventArgs: EventArguments<TContext, TState>,
  events:
    | Pick<
        RequestProcessingEvents<TContext, TState, TValidationError>,
        "onInvalidResponse"
      >
    | undefined,
  handler: core.StaticAppEndpointHandler<TContext, TValidationError>["handler"],
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
  onInvalidUrl?: (
    args: Omit<EventArguments<TContext, TState>, "groups">,
  ) => unknown;
  onInvalidMethod?: (args: EventArguments<TContext, TState>) => unknown;
  onInvalidContext?: (
    args: EventArguments<TContext, TState> & {
      validationError: TValidationError | undefined;
    },
  ) => unknown;
  // URL matched combined regex, but parameter validation failed
  onInvalidUrlParameters?: (
    args: EventArguments<TContext, TState> &
      ValidationErrorArgs<Array<TValidationError>>,
  ) => unknown;
  onInvalidQuery?: (
    args: EventArguments<TContext, TState> &
      ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidContentType?: (
    args: EventArguments<TContext, TState> & { contentType: string },
  ) => unknown;
  onInvalidBody?: (
    args: EventArguments<TContext, TState> &
      ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidResponse?: (
    args: EventArguments<TContext, TState> &
      ValidationErrorArgs<TValidationError>,
  ) => unknown;
}

export interface EventArguments<TContext, TState> {
  ctx: TContext;
  groups: Record<string, string>;
  regExp: RegExp;
  state: TState;
}

export interface ValidationErrorArgs<TValidationError> {
  validationError: TValidationError;
}
