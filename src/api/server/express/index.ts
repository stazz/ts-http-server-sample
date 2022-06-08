import * as core from "../../core/core";
import * as prefix from "../../core/prefix";
import * as server from "../../core/server";
import * as express from "express";
import { URL } from "url";

// eslint-disable-next-line @typescript-eslint/ban-types
export type Context<T = any> = {
  req: express.Request;
  res: express.Response<any, T>;
};

export const validateContextState = <TData, TError, TInput>(
  validator: core.DataValidator<TInput, TData, TError>,
  protocolErrorInfo?:
    | number
    | {
        statusCode: number;
        body: string | undefined;
      },
): core.ContextValidatorSpec<Context<TInput>, Context<TData>, TError> => ({
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
});

// Using given various endpoints, create object which is able to create ExpressJS middlewares.
// The factory object accepts callbacks to execute on certain scenarios (mostly on errors).
export const middlewareFactory = <TValidationError>(
  ...endpoints: Array<
    core.AppEndpoint<
      Context,
      Context,
      TValidationError,
      Record<string, unknown>
    >
  >
): MiddlewareFactory<TValidationError> => {
  // Combine given endpoints into top-level entrypoint
  const { url: regExp, handler } = prefix
    .atPrefix("", ...endpoints)
    .getRegExpAndHandler("");
  // Return Koa middleware handler factory
  return {
    use: (prev, events) =>
      prev.use(async (req, res) => {
        const ctx = { req, res };
        const parsedUrl = new URL(req.originalUrl, "http://dummy");
        const groupsAndEventArgs = server.checkURLPathNameForHandler(
          events,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          ctx as any,
          parsedUrl,
          regExp,
        );
        if (groupsAndEventArgs) {
          const { groups, eventArgs } = groupsAndEventArgs;
          // We have a match -> get the handler that will handle our match
          const foundHandler = server.checkMethodForHandler(
            events,
            eventArgs,
            groups,
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
              events,
              eventArgs,
              contextValidator,
            );
            if (contextValidation.result === "context") {
              // State was OK, validate url & query & body
              const [proceedAfterURL, url] =
                server.checkURLParametersForHandler(
                  events,
                  eventArgs,
                  groups,
                  urlValidator,
                );
              if (proceedAfterURL) {
                const [proceedAfterQuery, query] = server.checkQueryForHandler(
                  events,
                  eventArgs,
                  queryValidator,
                  parsedUrl.search.substring(1), // Remove leading '?'
                  Object.fromEntries(parsedUrl.searchParams.entries()),
                );
                if (proceedAfterQuery) {
                  const [proceedAfterBody, body] =
                    await server.checkBodyForHandler(
                      events,
                      eventArgs,
                      bodyValidator,
                      req.get("content-type") ?? "",
                      ctx.req,
                    );
                  if (proceedAfterBody) {
                    const retVal = server.invokeHandler(
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
      }),
  };
};

export interface MiddlewareFactory<TValidationError> {
  use: <TState>(
    previous: express.Application,
    events?: server.RequestProcessingEvents<TValidationError, Context<TState>>,
  ) => express.Application;
}
