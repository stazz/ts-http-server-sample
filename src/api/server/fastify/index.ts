import * as core from "../../core/core";
import * as prefix from "../../core/prefix";
import * as server from "../../core/server";
import * as fastify from "fastify";
import { URL } from "url";

export interface HKTContext extends server.HKTContext {
  readonly type: Context<this["_TState"]>;
}
type Context<T> = {
  req: FastifyContextWithState<T>;
  res: import("http").ServerResponse;
};

type FastifyContextWithState<T> = import("connect").IncomingMessage & {
  __tyrasState: T;
};

export const validateContextState: server.ContextValidatorFactory<
  HKTContext
> = (validator, protocolErrorInfo) => ({
  validator: (ctx) => {
    const transformed = validator(doGetStateFromContext(ctx));
    switch (transformed.error) {
      case "none":
        return {
          error: "none" as const,
          data: ctx as unknown as Context<
            server.DataValidatorOutput<typeof validator>
          >,
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
  getState: doGetStateFromContext,
});

export const getStateFromContext = <T>(ctx: Context<T>) =>
  doGetStateFromContext(ctx);

// export const getStateFromContext =
//   <T>(initialValue: T): ((ctx: Context<T>) => T) =>
//   (ctx) =>
//     doGetStateFromContext(ctx, { value: initialValue });

const doGetStateFromContext = <T>(
  { req }: Context<T>,
  initialValue?: { value: T },
) => doGetStateFromRequest(req, initialValue);

const doGetStateFromRequest = <T>(
  req: import("connect").IncomingMessage,
  initialValue: { value: T } | undefined,
) => {
  let state: T;
  if ("__tyrasState" in req) {
    state = (req as FastifyContextWithState<T>).__tyrasState;
  } else {
    if (!initialValue) {
      throw new Error("State must be present in context");
    }
    state = initialValue.value;
    (req as FastifyContextWithState<T>).__tyrasState = state;
  }
  return state;
};
export const modifyState = <TState>(
  req: import("connect").IncomingMessage,
  initialValue: TState,
  modify: (state: TState) => void,
) => {
  modify(doGetStateFromRequest(req, { value: initialValue }));
};

// export const __getStateFromRequest = <T>(req: FastifyContextWithState<T>) => {
//   return req.__tyrasState;
// };

// Using given various endpoints, create object which is able to create ExpressJS middlewares.
// The factory object accepts callbacks to execute on certain scenarios (mostly on errors).
export const createMiddleware = <TState, TValidationError>(
  endpoints: Array<
    core.AppEndpoint<Context<TState>, TValidationError, Record<string, unknown>>
  >,
  initialState: TState,
  events:
    | server.RequestProcessingEvents<Context<TState>, TState, TValidationError>
    | undefined = undefined,
): ((
  ...params: Parameters<fastify.preHandlerAsyncHookHandler>
) => Promise<unknown>) =>
  // ((
  //   req: import("connect").IncomingMessage & middie.IncomingMessageExtended,
  //   res: import("http").ServerResponse,
  //   next: () => void,
  // ) => Promise<void>)
  {
    // Combine given endpoints into top-level entrypoint
    const { url: regExp, handler } = prefix
      .atPrefix("", ...endpoints)
      .getRegExpAndHandler("");
    // Return Koa middleware handler factory
    return async (req, res) => {
      const ctx = {
        req: req.raw as FastifyContextWithState<TState>,
        res: res.raw,
      };
      const parsedUrl = new URL(req.raw.url ?? "<no url>", "http://dummy");
      const maybeEventArgs = server.checkURLPathNameForHandler(
        ctx,
        doGetStateFromContext(ctx, { value: initialState }),
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
                const bodyBuffer = Buffer.isBuffer(req.body)
                  ? req.body
                  : Buffer.from("");
                const [proceedAfterBody, body] =
                  await server.checkBodyForHandler(
                    eventArgs,
                    events,
                    bodyValidator,
                    req.headers["content-type"] ?? "",
                    bodyBuffer,
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
                          await res
                            .header("Content-Type", contentType)
                            .code(200) // OK
                            .send(output); // TODO do we need to pipe readable?
                        } else {
                          res.statusCode = 204; // No Content
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
          // .header("Allow", foundHandler.allowedMethods.join(","))
          // .code(405); // Method Not Allowed
        }
      } else {
        res.statusCode = 404; // Not Found
      }
    };
  };
