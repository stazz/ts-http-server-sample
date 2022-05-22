import type * as koa from "koa";
import * as model from "../model";
import * as rawbody from "raw-body";

export const createKoaMiddleware = (
  ...endpoints: Array<model.AppEndpoint<koa.Context>>
): koa.Middleware => {
  // Combine given endpoints into top-level entrypoint
  const { url, handler } = model
    .atPrefix("", ...endpoints)
    .getRegExpAndHandler("");
  // eslint-disable-next-line no-console
  console.log("REGEXP", url);
  // Return Koa middleware handler
  return async (ctx) => {
    const groups = url.exec(ctx.URL.pathname)?.groups;
    // TODO check query too, if specified
    if (groups) {
      // We have a match -> get the handler that will handle our match
      const foundHandler = handler(ctx.method as model.HttpMethod, groups);
      switch (foundHandler.found) {
        case "handler":
          {
            let retVal: unknown;
            const { handler } = foundHandler;
            switch (handler.body) {
              case "none":
                // No body -> just handle based on URL
                retVal = handler.handler(ctx, groups);
                break;
              case "required":
                // The body must be present -> read and validate, and pass on to handler
                {
                  let body: unknown;
                  try {
                    body = JSON.parse(
                      await rawbody.default(ctx.req, { encoding: "utf8" }),
                    );
                  } catch {
                    // TODO log this.
                    // This is not a showstopper - our body validation might as well accept situations without the body.
                  }
                  if (handler.isBodyValid(body)) {
                    retVal = handler.handler(body, ctx, groups);
                  } else {
                    ctx.status = 422; // Unprocessable Entity
                    // TODO we probably want to log actual validation error.
                  }
                }
                break;
            }
            if (retVal !== undefined) {
              ctx.body = JSON.stringify(retVal);
            }
          }
          break;
        case "invalid-method":
          ctx.status = 405; // Method Not Allowed
          ctx.set("Allow", foundHandler.allowedMethods.join(","));
          break;
      }
    } else {
      ctx.status = 404; // Not Found
      ctx.body = ""; // Otherwise it will have text "Not Found"
    }
  };
};
