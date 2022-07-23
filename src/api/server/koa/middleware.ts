import * as ep from "../../core/endpoint";
import * as prefix from "../../core/prefix";
import * as server from "../../core/server";
import * as koa from "koa";

// Using given various endpoints, create Koa middlewares.
export const createMiddleware = <TState>(
  endpoints: Array<
    ep.AppEndpoint<koa.ParameterizedContext<TState>, Record<string, unknown>>
  >,
  events:
    | server.ServerEventEmitter<koa.ParameterizedContext<TState>, TState>
    | undefined = undefined,
): koa.Middleware<TState> => {
  // Combine given endpoints into top-level entrypoint
  const { url: regExp, handler } = prefix
    .atPrefix("", ...endpoints)
    .getRegExpAndHandler("");
  // Return Koa middleware handler factory
  return async (ctx) => {
    const maybeEventArgs = server.checkURLPathNameForHandler(
      ctx,
      ctx.state,
      events,
      ctx.URL,
      regExp,
    );
    if (maybeEventArgs) {
      // We have a match -> get the handler that will handle our match
      const foundHandler = server.checkMethodForHandler(
        maybeEventArgs,
        events,
        ctx.method as ep.HttpMethod,
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
        const contextValidation = server.checkContextForHandler(
          maybeEventArgs,
          events,
          contextValidator,
        );
        if (contextValidation.result === "context") {
          const eventArgs = {
            ...maybeEventArgs,
            ctx: contextValidation.context as typeof ctx,
            state: contextValidation.state as TState,
          };
          // State was OK, validate url & query & body
          const [proceedAfterURL, url] = server.checkURLParametersForHandler(
            eventArgs,
            events,
            urlValidator,
          );
          if (proceedAfterURL) {
            const [proceedAfterQuery, query] = server.checkQueryForHandler(
              eventArgs,
              events,
              queryValidator,
              ctx.querystring,
              ctx.query,
            );
            if (proceedAfterQuery) {
              const [proceedAfterBody, body] = await server.checkBodyForHandler(
                eventArgs,
                events,
                bodyValidator,
                ctx.get("content-type"),
                ctx.req,
              );
              if (proceedAfterBody) {
                const retVal = server.invokeHandler(
                  eventArgs,
                  events,
                  handler,
                  {
                    context: eventArgs.ctx,
                    state: eventArgs.state,
                    url,
                    body,
                    query,
                  },
                );
                switch (retVal.error) {
                  case "none":
                    {
                      const { contentType, output, headers } = retVal.data;
                      if (headers) {
                        for (const [hdrName, hdrValue] of Object.entries(
                          headers,
                        )) {
                          ctx.set(hdrName, hdrValue);
                        }
                      }
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
                ctx.body = "";
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
  };
};
