import * as core from "../../core/core";
import * as prefix from "../../core/prefix";
import * as server from "../../core/server";
import * as express from "express";
import { URL } from "url";

// eslint-disable-next-line @typescript-eslint/ban-types
export interface HKTContext extends server.HKTContext {
  readonly type: Context<this["_TState"]>;
}
// eslint-disable-next-line @typescript-eslint/ban-types
type Context<T> = {
  req: express.Request;
  res: express.Response<any, T>;
};

export const validateContextState: server.ContextValidatorFactory<
  HKTContext
> = <TInput, TData, TError>(
  validator: core.DataValidator<TInput, TData, TError>,
  protocolErrorInfo?:
    | number
    | {
        statusCode: number;
        body: string | undefined;
      },
): core.ContextValidatorSpec<
  Context<TInput>,
  Context<TData>,
  TData,
  TError
> => ({
  validator: (ctx) => {
    const transformed = validator(ctx.res.locals);
    switch (transformed.error) {
      case "none":
        return {
          error: "none" as const,
          data: ctx as unknown as Context<TData>,
        };
      default:
        return protocolErrorInfo === undefined
          ? {
              error: "error",
              errorInfo: transformed.errorInfo,
            }
          : {
              error: "protocol-error",
              statusCode:
                typeof protocolErrorInfo === "number"
                  ? protocolErrorInfo
                  : protocolErrorInfo.statusCode,
              body:
                typeof protocolErrorInfo === "number"
                  ? undefined
                  : protocolErrorInfo.body,
            };
    }
  },
  getState: (ctx) => ctx.res.locals,
});

// Using given various endpoints, create object which is able to create ExpressJS middlewares.
// The factory object accepts callbacks to execute on certain scenarios (mostly on errors).
export const createMiddleware = <TState, TValidationError>(
  endpoints: Array<
    core.AppEndpoint<Context<TState>, TValidationError, Record<string, unknown>>
  >,
  events:
    | server.RequestProcessingEvents<Context<TState>, TState, TValidationError>
    | undefined = undefined,
): // Notice that we must use this explicit form
// If we use express.RequestHandler, we will get an error because of asyncness.
// I guess Express typings are lagging behind or something.
((
  req: express.Request<any, any, any, any, TState>,
  res: express.Response<any, TState>,
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
        req.method as core.HttpMethod,
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
                          .send(output) // TODO do we need to pipe readable?
                          .status(200); // OK
                      } else {
                        res.status(204); // No Content
                      }
                    }
                    break;
                  case "error": {
                    res.status(500); // Internal Server Error
                  }
                }
              } else {
                // Body failed validation
                res.status(422);
              }
            } else {
              // Query parameters failed validation
              res.status(400).send("");
            }
          } else {
            // While URL matched regex, the parameters failed further validation
            res.status(400).send("");
          }
        } else {
          // Context validation failed - set status code
          res
            .status(contextValidation.customStatusCode ?? 500) // Internal server error
            .send(contextValidation.customBody ?? "");
        }
      } else {
        res
          .status(405) // Method Not Allowed
          .set("Allow", foundHandler.allowedMethods.join(","));
      }
    } else {
      res
        .status(404) // Not Found
        .send(""); // Otherwise it will have text "Not Found"
    }
  };
};
