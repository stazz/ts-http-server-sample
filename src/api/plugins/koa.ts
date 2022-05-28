import type * as koa from "koa";
import * as model from "../model";

export type KoaContext = koa.Context;

export const validateContextState = <TData, TError, TInput>(
  validator: model.DataValidator<TInput, TData, TError>,
): model.ContextValidatorSpec<
  koa.ParameterizedContext<TInput>,
  koa.ParameterizedContext<TData>,
  TError
> => ({
  validator: (ctx) => {
    const transformed = validator(ctx.state);
    switch (transformed.error) {
      case "none":
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
  },
});

// Using given various endpoints, create object which is able to create Koa middlewares.
// The factory object accepts callbacks to execute on certain scenarios (mostly on errors).
export const koaMiddlewareFactory = <TValidationError, TRefinedContext>(
  ...endpoints: Array<
    model.AppEndpoint<KoaContext, TRefinedContext, TValidationError>
  >
): KoaMiddlewareFactory<TValidationError> => {
  // Combine given endpoints into top-level entrypoint
  const { url, handler } = model
    .atPrefix("", ...endpoints)
    .getRegExpAndHandler("");
  // Return Koa middleware handler factory
  return {
    use: (prev, events) =>
      prev.use(async (ctx) => {
        // Pathname will not include query
        const groups = url.exec(ctx.URL.pathname)?.groups;
        if (groups) {
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
                  handler: {
                    contextValidator,
                    queryValidator,
                    bodyValidator,
                    handler,
                  },
                } = foundHandler;
                // At this point, check context state.
                // State typically includes things like username etc, so verifying it as a first thing before checking body is meaningful.
                // Also, allow the context state checker return custom status code, e.g. 401 for when lacking credentials.
                const contextValidation = contextValidator(ctx);
                switch (contextValidation.error) {
                  case "none":
                    {
                      // State was OK, validate query & body
                      const [proceedAfterQuery, query] = checkQueryForHandler(
                        eventArgs,
                        queryValidator,
                      );
                      if (proceedAfterQuery) {
                        const [proceedAfterBody, body] =
                          await checkBodyForHandler(
                            events,
                            eventArgs,
                            bodyValidator,
                          );
                        if (proceedAfterBody) {
                          const retVal = handler({
                            context: contextValidation.data,
                            body,
                            query,
                          });
                          switch (retVal.error) {
                            case "none":
                              {
                                const { contentType, output } = retVal.data;
                                if (output !== undefined) {
                                  ctx.set("Content-Type", contentType);
                                  ctx.body = output;
                                  ctx.status = 200; // OK
                                } else {
                                  ctx.status = 204; // No Content
                                }
                              }
                              break;
                            case "error": {
                              ctx.status = 500; // Internal Server Error
                              events?.onInvalidResponse?.({
                                ...eventArgs,
                                validationError: retVal.errorInfo,
                              });
                            }
                          }
                        }
                      }
                    }
                    break;
                  case "error":
                    ctx.status = 500; // Internal server error
                    events?.onInvalidKoaState?.({
                      ...eventArgs,
                      validationError: contextValidation.errorInfo,
                    });
                    break;
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
      }),
  };
};

export interface KoaMiddlewareFactory<TValidationError> {
  use: <TState>(
    previous: koa<TState>,
    events?: KoaMiddlewareEvents<TValidationError, TState>,
  ) => koa<TState>;
}

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
  onInvalidContentType?: (
    args: EventArguments<TState> & { contentType: string },
  ) => unknown;
  onInvalidBody?: (
    args: EventArguments<TState> & ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidResponse?: (
    args: EventArguments<TState> & ValidationErrorArgs<TValidationError>,
  ) => unknown;
}

const checkQueryForHandler = <TValidationError, TState>(
  eventArgs: EventArguments<TState>,
  queryValidation: model.QueryValidator<unknown, TValidationError> | undefined,
) => {
  const ctx = eventArgs.ctx;
  let proceedToInvokeHandler: boolean;
  let query: unknown;
  if (queryValidation) {
    let queryValidationResult: model.DataValidatorResult<
      unknown,
      TValidationError
    >;
    switch (queryValidation.query) {
      case "string":
        queryValidationResult = queryValidation.validator(ctx.querystring);
        break;
      case "object":
        queryValidationResult = queryValidation.validator(ctx.query);
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
        ctx.status = 400;
        ctx.body = "";
        proceedToInvokeHandler = false;
        // TODO invoke event
        break;
    }
  } else {
    // Only OK if query is none
    proceedToInvokeHandler = ctx.querystring.length === 0;
    if (!proceedToInvokeHandler) {
      ctx.status = 400;
      ctx.body = "";
    }
  }

  return [proceedToInvokeHandler, query];
};

const checkBodyForHandler = async <TValidationError, TState>(
  events: KoaMiddlewareEvents<TValidationError, TState> | undefined,
  eventArgs: EventArguments<TState>,
  isBodyValid:
    | model.DataValidatorRequestInput<unknown, TValidationError>
    | undefined,
) => {
  const ctx = eventArgs.ctx;
  let body: unknown;
  let proceedToInvokeHandler: boolean;
  if (isBodyValid) {
    const contentType = ctx.get("content-type");
    const bodyValidationResult = await isBodyValid({
      contentType: contentType,
      input: ctx.req,
    });
    switch (bodyValidationResult.error) {
      case "none":
        body = bodyValidationResult.data;
        proceedToInvokeHandler = true;
        break;
      default:
        ctx.status = 422;
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
