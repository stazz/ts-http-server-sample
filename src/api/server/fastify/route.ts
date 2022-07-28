import * as ep from "../../core/endpoint";
import * as prefix from "../../core/prefix";
import * as server from "../../core/server";
import type * as fastify from "fastify";
import type * as ctx from "./context-types";
import * as state from "./state-internal";
import { URL } from "url";
import { Readable } from "stream";

// Using given various endpoints, create object which is able to handle the requests as Fastify route.
export const createRoute = <TState>(
  endpoints: Array<
    ep.AppEndpoint<ctx.Context<TState>, Record<string, unknown>>
  >,
  initialState: TState,
  events:
    | server.ServerEventEmitter<ctx.Context<TState>, TState>
    | undefined = undefined,
): FastifyRouteHandler => {
  // Combine given endpoints into top-level entrypoint
  const { url: regExp, handler } = prefix
    .atPrefix("", ...endpoints)
    .getRegExpAndHandler("");
  // Return Koa middleware handler factory
  return async (req, res) => {
    const ctx = {
      req: req.raw as ctx.FastifyRequestWithState<TState>,
      res: res.raw,
    };
    const parsedUrl = new URL(req.raw.url ?? "<no url>", "http://dummy");
    const maybeEventArgs = server.checkURLPathNameForHandler(
      ctx,
      state.doGetStateFromContext(ctx, { value: initialState }),
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
            headerValidator,
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
              server.checkHeadersForHandler(
                eventArgs,
                events,
                headerValidator,
                // TODO multi-headers
                (hdrName) => req.headers[hdrName],
              );

              const bodyStream =
                req.body instanceof Readable ? req.body : undefined;
              const [proceedAfterBody, body] = await server.checkBodyForHandler(
                eventArgs,
                events,
                bodyValidator,
                req.headers["content-type"] ?? "",
                bodyStream,
              );
              if (proceedAfterBody) {
                const retVal = await server.invokeHandler(
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
                          res = res.header(hdrName, hdrValue);
                        }
                      }
                      const statusCode = output === undefined ? 204 : 200;
                      res = res.code(statusCode);
                      if (statusCode === 200) {
                        await res
                          .header("Content-Type", contentType)
                          .send(output); // TODO do we need to pipe readable?
                      }
                    }
                    break;
                  case "error": {
                    res.statusCode = 500; // Internal Server Error
                  }
                }
              } else {
                // Body failed validation
                res.statusCode = 422;
              }
            } else {
              // Query parameters failed validation
              res.statusCode = 400;
            }
          } else {
            // While URL matched regex, the parameters failed further validation
            res.statusCode = 400;
          }
        } else {
          // Context validation failed - set status code
          await res
            .code(contextValidation.customStatusCode ?? 500) // Internal server error
            .send(contextValidation.customBody);
        }
      } else {
        res.raw.setHeader("Allow", foundHandler.allowedMethods.join(","));
        res.statusCode = 405;
      }
    } else {
      res.statusCode = 404; // Not Found
    }
  };
};

export const registerRouteToFastifyInstance = (
  instance: fastify.FastifyInstance,
  middleware: FastifyRouteHandler,
  options: Omit<fastify.RouteOptions, "method" | "url" | "handler">,
) => {
  // We must pass body completely raw to our route, since only in the route we will know the actual body validation.
  // To achieve that, we remove the default content type parsers, and register universal parser, which simply passes the body as-is onwards to the route.
  instance.removeAllContentTypeParsers();
  instance.addContentTypeParser(/.*/, {}, (_, rawBody, done) => {
    done(null, rawBody);
  });
  instance.route({
    ...options,
    // Capture all methods
    method: ["GET", "POST", "PUT", "PATCH", "OPTIONS", "HEAD", "DELETE"],
    // Capture all URLs
    url: "*",
    // Handle them with the handler
    handler: middleware,
  });
};

export type FastifyRouteHandler = (
  ...params: Parameters<fastify.preHandlerAsyncHookHandler>
) => Promise<void>;
