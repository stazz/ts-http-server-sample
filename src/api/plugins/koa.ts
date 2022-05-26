import type * as koa from "koa";
import * as model from "../model";
import * as rawbody from "raw-body";

export type KoaContext = koa.Context;

// Using given various endpoints, create object which is able to create Koa middlewares.
// The factory object accepts callbacks to execute on certain scenarios (mostly on errors).
export const koaMiddlewareFactory = <TValidationError, TState>(
  stateValidator: model.DataValidatorInput<TState, TValidationError>,
  ...endpoints: Array<
    model.AppEndpoint<koa.ParameterizedContext<TState>, TValidationError>
  >
): KoaMiddlewareFactory<TValidationError, TState> => {
  // Combine given endpoints into top-level entrypoint
  const { url, handler } = model
    .atPrefix("", ...endpoints)
    .getRegExpAndHandler("");
  // Return Koa middleware handler factory
  return {
    createMiddleware: (events) => {
      return async (ctx) => {
        const groups = url.exec(ctx.URL.pathname)?.groups;
        if (groups) {
          // TODO check query too, if specified
          const eventArgs = {
            ctx,
            groups,
            regExp: url,
          };
          // We have a match -> get the handler that will handle our match
          const foundHandler = handler(ctx.method as model.HttpMethod, groups);
          switch (foundHandler.found) {
            case "handler":
              {
                const {
                  handler: { isBodyValid, handler },
                } = foundHandler;
                let body: unknown;
                let proceedToInvokeHandler = true;
                if (isBodyValid) {
                  let unvalidatedBody: unknown;
                  try {
                    unvalidatedBody = JSON.parse(
                      await rawbody.default(ctx.req, { encoding: "utf8" }),
                    );
                  } catch (e) {
                    events?.onBodyJSONParseError?.({
                      ...eventArgs,
                      exception: e,
                    });
                    // This is not a showstopper - our body validation might as well accept situations without the body.
                  }
                  const bodyValidationResponse = isBodyValid(unvalidatedBody);
                  switch (bodyValidationResponse.error) {
                    case "in-none":
                      body = bodyValidationResponse.data;
                      break;
                    case "in-error":
                      ctx.status = 422;
                      proceedToInvokeHandler = false;
                      events?.onInvalidBody?.({
                        ...eventArgs,
                        validationError: bodyValidationResponse.errorInfo,
                      });
                      break;
                  }
                }

                let retVal:
                  | model.DataValidatorResponseOutput<unknown, TValidationError>
                  | undefined;
                if (proceedToInvokeHandler) {
                  // Body (if supplied) was OK, now check state
                  const stateValidation = stateValidator(ctx.state);
                  switch (stateValidation.error) {
                    case "in-none":
                      retVal = handler(ctx, body);
                      break;
                    case "in-error":
                      ctx.status = 500; // Internal server error
                      events?.onInvalidKoaState?.({
                        ...eventArgs,
                        validationError: stateValidation.errorInfo,
                      });
                      break;
                  }
                }

                // Check result
                if (retVal) {
                  switch (retVal.error) {
                    case "out-none":
                      {
                        const output = retVal.data;
                        ctx.status = 200; // OK
                        if (output !== undefined) {
                          ctx.set("Content-Type", "application/json");
                          ctx.body = JSON.stringify(output);
                        }
                      }
                      break;
                    case "out-error": {
                      ctx.status = 500; // Internal Server Error
                      events?.onInvalidResponse?.({
                        ...eventArgs,
                        validationError: retVal.errorInfo,
                      });
                    }
                  }
                }
              }
              break;
            case "invalid-method":
              ctx.status = 405; // Method Not Allowed
              ctx.set("Allow", foundHandler.allowedMethods.join(","));
              events?.onInvalidMethod?.({ ...eventArgs });
              break;
          }
        } else {
          ctx.status = 404; // Not Found
          ctx.body = ""; // Otherwise it will have text "Not Found"
          events?.onInvalidUrl?.({ ctx, regExp: url });
        }
      };
    },
  };
};

export const validateContextState =
  <TData, TError, TInput>(
    validator: model.DataValidator<
      TData,
      TError,
      TInput,
      "in-none",
      "in-error"
    >,
  ): model.DataValidator<
    koa.ParameterizedContext<TData>,
    TError,
    koa.ParameterizedContext<TInput>,
    "none",
    "error"
  > =>
  (ctx) => {
    const transformed = validator(ctx.state);
    switch (transformed.error) {
      case "in-none":
        return {
          error: "none" as const,
          data: ctx as unknown as koa.ParameterizedContext<TData>,
        };
      default:
        return {
          error: "error",
          errorInfo: transformed.errorInfo,
        };
    }
  };

export interface EventArguments<TState> {
  ctx: koa.ParameterizedContext<TState>;
  groups: Record<string, string>;
  regExp: RegExp;
}

export interface ValidationErrorArgs<TValidationError> {
  validationError: TValidationError;
}
export interface KoaMiddlewareEvents<TValidationError, TState> {
  onInvalidKoaState?: (
    args: EventArguments<TState> & ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidMethod?: (args: EventArguments<TState>) => unknown;
  onInvalidUrl?: (args: Omit<EventArguments<TState>, "groups">) => unknown;
  onBodyJSONParseError?: (
    args: EventArguments<TState> & { exception: unknown },
  ) => unknown;
  onInvalidBody?: (
    args: EventArguments<TState> & ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidResponse?: (
    args: EventArguments<TState> & ValidationErrorArgs<TValidationError>,
  ) => unknown;
}

export interface KoaMiddlewareFactory<TValidationError, TState> {
  createMiddleware: (
    events?: KoaMiddlewareEvents<TValidationError, TState>,
  ) => koa.Middleware<TState>;
}
