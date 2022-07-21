import type * as evt from "./events";
import type * as ep from "../endpoint";
import * as data from "../data-server";

import type * as evtEmit from "@data-heaving/common";

import * as stream from "stream";
import * as u from "url";

export type ServerEventEmitter<
  TContext,
  TState,
  TEvents extends keyof evt.VirtualRequestProcessingEvents<
    TContext,
    TState
  > = keyof evt.VirtualRequestProcessingEvents<TContext, TState>,
> = evtEmit.EventEmitter<
  Pick<evt.VirtualRequestProcessingEvents<TContext, TState>, TEvents>
>;

export const checkURLPathNameForHandler = <TContext, TState>(
  ctx: TContext,
  state: TState,
  events: ServerEventEmitter<TContext, TState, "onInvalidUrl"> | undefined,
  url: u.URL | string,
  regExp: RegExp,
) => {
  const pathName = (url instanceof u.URL ? url : new u.URL(url)).pathname;
  const groups = regExp.exec(pathName)?.groups;
  if (!groups) {
    events?.emit("onInvalidUrl", {
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

export const checkMethodForHandler = <TContext, TState>(
  eventArgs: evt.EventArguments<TContext, TState>,
  events: ServerEventEmitter<TContext, TState, "onInvalidMethod"> | undefined,
  method: ep.HttpMethod,
  handler: ep.DynamicHandlerGetter<TContext>,
) => {
  const foundHandler = handler(method, eventArgs.groups);
  const foundSuccess = foundHandler.found === "handler";
  if (!foundSuccess) {
    events?.emit("onInvalidMethod", {
      ...eventArgs,
    });
  }
  return foundHandler;
};

export const checkContextForHandler = <TContext, TState>(
  eventArgs: evt.EventArguments<TContext, TState>,
  events: ServerEventEmitter<TContext, TState, "onInvalidContext"> | undefined,
  {
    validator,
    getState,
  }: ep.StaticAppEndpointHandler<TContext>["contextValidator"],
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
    events?.emit("onInvalidContext", {
      ...eventArgs,
      validationError: isProtocolError ? undefined : validationResult,
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

export const checkURLParametersForHandler = <TContext, TState>(
  eventArgs: evt.EventArguments<TContext, TState>,
  events:
    | ServerEventEmitter<TContext, TState, "onInvalidUrlParameters">
    | undefined,
  urlValidation: ep.StaticAppEndpointHandler<TContext>["urlValidator"],
) => {
  let url: Record<string, unknown> | undefined;
  let proceedToInvokeHandler: boolean;
  if (urlValidation) {
    url = {};
    const errors: Array<data.DataValidatorResultError> = [];
    for (const [groupName, { parameterName, validator }] of Object.entries(
      urlValidation,
    )) {
      const groupValue = eventArgs.groups[groupName];
      if (groupValue === undefined) {
        errors.push(
          data.exceptionAsValidationError(
            `No regexp match for group ${groupName}`,
          ),
        );
      } else {
        const validatorResult = validator(groupValue);
        switch (validatorResult.error) {
          case "none":
            url[parameterName] = validatorResult.data;
            break;
          default:
            errors.push(validatorResult);
            break;
        }
      }
    }
    proceedToInvokeHandler = errors.length === 0;
    if (!proceedToInvokeHandler) {
      events?.emit("onInvalidUrlParameters", {
        ...eventArgs,
        validationError: errors,
      });
    }
  } else {
    proceedToInvokeHandler = true;
  }
  return [proceedToInvokeHandler, url];
};

export const checkQueryForHandler = <TContext, TState>(
  eventArgs: evt.EventArguments<TContext, TState>,
  events: ServerEventEmitter<TContext, TState, "onInvalidQuery"> | undefined,
  queryValidation: ep.StaticAppEndpointHandler<TContext>["queryValidator"],
  queryString: string,
  queryObject:
    | Record<string, string | Array<string> | undefined>
    | (() => data.DataValidatorResultError),
) => {
  let proceedToInvokeHandler: boolean;
  let query: unknown;
  if (queryValidation) {
    let queryValidationResult: data.DataValidatorResult<unknown>;
    switch (queryValidation.query) {
      case "string":
        queryValidationResult = queryValidation.validator(queryString);
        break;
      case "object":
        if (typeof queryObject === "function") {
          queryValidationResult = queryObject();
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
        events?.emit("onInvalidQuery", {
          ...eventArgs,
          validationError: queryValidationResult,
        });
    }
  } else {
    // Only OK if query is none
    proceedToInvokeHandler = queryString.length === 0;
  }

  return [proceedToInvokeHandler, query];
};

export const checkBodyForHandler = async <TContext, TState>(
  eventArgs: evt.EventArguments<TContext, TState>,
  events:
    | ServerEventEmitter<
        TContext,
        TState,
        "onInvalidBody" | "onInvalidContentType"
      >
    | undefined,
  isBodyValid: ep.StaticAppEndpointHandler<TContext>["bodyValidator"],
  contentType: string,
  bodyStream: stream.Readable | undefined,
) => {
  let body: unknown;
  let proceedToInvokeHandler: boolean;
  if (isBodyValid) {
    const bodyValidationResult = await isBodyValid({
      contentType: contentType,
      input:
        bodyStream ??
        new stream.Readable({
          read() {
            setImmediate(() => {
              this.push(null);
              this.push(Buffer.alloc(0));
              this.push(null);
            });
          },
        }),
    });
    switch (bodyValidationResult.error) {
      case "none":
        body = bodyValidationResult.data;
        proceedToInvokeHandler = true;
        break;
      default:
        proceedToInvokeHandler = false;
        if (bodyValidationResult.error === "error") {
          events?.emit("onInvalidBody", {
            ...eventArgs,
            validationError: bodyValidationResult,
          });
        } else {
          events?.emit("onInvalidContentType", {
            ...eventArgs,
            contentType,
          });
        }
        break;
    }
  } else {
    proceedToInvokeHandler =
      bodyStream === undefined || bodyStream.readableLength === 0;
  }

  return [proceedToInvokeHandler, body];
};

export const invokeHandler = <TContext, TState>(
  eventArgs: evt.EventArguments<TContext, TState>,
  events:
    | ServerEventEmitter<
        TContext,
        TState,
        | "onInvalidResponse"
        | "onSuccessfulInvocationStart"
        | "onSuccessfulInvocationEnd"
      >
    | undefined,
  handler: ep.StaticAppEndpointHandler<TContext>["handler"],
  ...handlerParameters: Parameters<typeof handler>
) => {
  events?.emit("onSuccessfulInvocationStart", { ...eventArgs });
  const retVal = handler(...handlerParameters);
  if (retVal.error === "none") {
    events?.emit("onSuccessfulInvocationEnd", { ...eventArgs });
  } else {
    events?.emit("onInvalidResponse", {
      ...eventArgs,
      validationError: retVal,
    });
  }
  return retVal;
};
