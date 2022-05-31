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
  const { url: regExp, handler } = model
    .atPrefix("", ...endpoints)
    .getRegExpAndHandler("");
  // Return Koa middleware handler factory
  return {
    use: (prev, events) =>
      prev.use(async (ctx) => {
        const groupsAndEventArgs = model.checkURLPathNameForHandler(
          events,
          ctx,
          ctx.URL,
          regExp,
        );
        if (groupsAndEventArgs) {
          const { groups, eventArgs } = groupsAndEventArgs;
          // We have a match -> get the handler that will handle our match
          const foundHandler = model.checkMethodForHandler(
            events,
            eventArgs,
            groups,
            ctx.method as model.HttpMethod,
            handler,
          );

          if (foundHandler.found === "handler") {
            const {
              handler: {
                contextValidator,
                urlValidator,
                queryValidator,
                bodyValidator,
                handler,
              },
            } = foundHandler;
            // At this point, check context state.
            // State typically includes things like username etc, so verifying it as a first thing before checking body is meaningful.
            // Also, allow the context state checker return custom status code, e.g. 401 for when lacking credentials.
            const contextValidation = model.checkContextForHandler(
              events,
              eventArgs,
              contextValidator,
            );
            if (contextValidation.result === "context") {
              // State was OK, validate url & query & body
              const [proceedAfterURL, url] = model.checkURLParametersForHandler(
                events,
                eventArgs,
                groups,
                urlValidator,
              );
              if (proceedAfterURL) {
                const [proceedAfterQuery, query] = model.checkQueryForHandler(
                  events,
                  eventArgs,
                  queryValidator,
                  ctx.querystring,
                  ctx.query,
                );
                if (proceedAfterQuery) {
                  const [proceedAfterBody, body] =
                    await model.checkBodyForHandler(
                      events,
                      eventArgs,
                      bodyValidator,
                      ctx.get("content-type"),
                      ctx.req,
                    );
                  if (proceedAfterBody) {
                    const retVal = model.invokeHandler(
                      events,
                      eventArgs,
                      handler,
                      {
                        context: contextValidation.context,
                        url,
                        body,
                        query,
                      },
                    );
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
                      }
                    }
                  } else {
                    // Body failed validation
                    ctx.status = 422;
                  }
                } else {
                  // Query parameters failed validation
                  ctx.status = 400;
                  ctx.body = "";
                }
              } else {
                // While URL matched regex, the parameters failed further validation
                ctx.status = 400;
                ctx.body = "";
              }
            } else {
              // Context validation failed - set status code
              ctx.status = contextValidation.customStatusCode ?? 500; // Internal server error
              ctx.body = contextValidation.customBody ?? "";
            }
          } else {
            ctx.status = 405; // Method Not Allowed
            ctx.set("Allow", foundHandler.allowedMethods.join(","));
          }
        } else {
          ctx.status = 404; // Not Found
          ctx.body = ""; // Otherwise it will have text "Not Found"
        }
      }),
  };
};

export interface KoaMiddlewareFactory<TValidationError> {
  use: <TState>(
    previous: koa<TState>,
    events?: model.RequestProcessingEvents<
      TValidationError,
      koa.ParameterizedContext<TState>
    >,
  ) => koa<TState>;
}
