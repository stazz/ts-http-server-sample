import type * as koa from "koa";
import * as model from "../model";
import * as rawbody from "raw-body";

export type KoaContext<TState> = koa.ParameterizedContext<TState>;

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
      const checkContextForHandler = (
        ctx: koa.Context,
        eventArgs: EventArguments<TState>,
      ) => {
        const stateValidation = stateValidator(ctx.state);
        const isError = stateValidation.error === "in-error";
        if (isError) {
          ctx.status = 500; // Internal server error
          events?.onInvalidKoaState?.({
            ...eventArgs,
            validationError: stateValidation.errorInfo,
          });
        }
        return !isError;
      };
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
                let retVal:
                  | model.DataValidatorResponseOutput<unknown, TValidationError>
                  | undefined;
                const { handler } = foundHandler;
                switch (handler.body) {
                  case "none":
                    // No body -> just handle based on URL
                    if (checkContextForHandler(ctx, eventArgs)) {
                      retVal = handler.handler(ctx, groups);
                    }
                    break;
                  case "required":
                    // The body must be present -> read and validate, and pass on to handler
                    {
                      let body: unknown;
                      try {
                        body = JSON.parse(
                          await rawbody.default(ctx.req, { encoding: "utf8" }),
                        );
                      } catch (e) {
                        events?.onBodyJSONParseError?.({
                          ...eventArgs,
                          exception: e,
                        });
                        // This is not a showstopper - our body validation might as well accept situations without the body.
                      }
                      const bodyValidationResponse = handler.isBodyValid(body);
                      switch (bodyValidationResponse.error) {
                        case "in-none":
                          if (checkContextForHandler(ctx, eventArgs)) {
                            retVal = handler.handler(
                              bodyValidationResponse.data,
                              ctx,
                              groups,
                            );
                          }
                          break;
                        case "in-error":
                          ctx.status = 422;
                          events?.onInvalidBody?.({
                            ...eventArgs,
                            validationError: bodyValidationResponse.errorInfo,
                          });
                          break;
                      }
                    }
                    break;
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
