import * as ep from "../../core/endpoint";
import * as prefix from "../../core/prefix";
import * as server from "../../core/server";
import * as ctx from "./context-types";
import { URL } from "url";
import type * as express from "express";

// Using given various endpoints, create ExpressJS middlewares.
export const createMiddleware = <TState, TValidationError>(
  endpoints: Array<
    ep.AppEndpoint<
      ctx.Context<TState>,
      TValidationError,
      Record<string, unknown>
    >
  >,
  events:
    | server.ServerEventEmitter<ctx.Context<TState>, TState, TValidationError>
    | undefined = undefined,
): // Notice that we must use this explicit form
// If we use express.RequestHandler, we will get an error because of asyncness.
// I guess Express typings are lagging behind or something.
((
  req: express.Request,
  res: express.Response<unknown, TState>,
) => Promise<unknown>) => {
  // Combine given endpoints into top-level entrypoint
  const { url: regExp, handler } = prefix
    .atPrefix("", ...endpoints)
    .getRegExpAndHandler("");
  // Return Koa middleware handler factory
  return async (req, res) => {
    const ctx = { req, res };
    const parsedUrl = new URL(req.originalUrl, "http://dummy");
    const maybeEventArgs = server.checkURLPathNameForHandler(
      ctx,
      res.locals,
      events,
      parsedUrl,
      regExp,
    );
    if (maybeEventArgs) {
      // We have a match -> get the handler that will handle our match
      const foundHandler = server.checkMethodForHandler(
        maybeEventArgs,
        events,
        req.method as ep.HttpMethod,
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
              parsedUrl.search.substring(1), // Remove leading '?'
              Object.fromEntries(parsedUrl.searchParams.entries()),
            );
            if (proceedAfterQuery) {
              const [proceedAfterBody, body] = await server.checkBodyForHandler(
                eventArgs,
                events,
                bodyValidator,
                req.get("content-type") ?? "",
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
                      const { contentType, output } = retVal.data;
                      if (output !== undefined) {
                        res
                          .set("Content-Type", contentType)
                          .status(200) // OK
                          .send(output); // TODO do we need to pipe readable?
                      } else {
                        res
                          .status(204) // No Content
                          .send(undefined); // Notice we still must call 'send', otherwise will become stuck
                      }
                    }
                    break;
                  case "error": {
                    res.status(500).send(undefined); // Internal Server Error
                  }
                }
              } else {
                // Body failed validation
                res.status(422).send(undefined);
              }
            } else {
              // Query parameters failed validation
              res.status(400).send(undefined);
            }
          } else {
            // While URL matched regex, the parameters failed further validation
            res.status(400).send(undefined);
          }
        } else {
          // Context validation failed - set status code
          res
            .status(contextValidation.customStatusCode ?? 500) // Internal server error
            .send(contextValidation.customBody);
        }
      } else {
        res
          .status(405) // Method Not Allowed
          .set("Allow", foundHandler.allowedMethods.join(","))
          .send(undefined); // Otherwise will become stuck
      }
    } else {
      res
        .status(404) // Not Found
        .send(undefined); // Otherwise it will have text "Not Found"
    }
  };
};
