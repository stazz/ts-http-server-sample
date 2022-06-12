// Import code to create REST API endpoints
import * as spec from "./api/core/spec";
import * as server from "./api/core/server";
import * as endpoints from "./rest-endpoints";

// Lock in our vendor choices:
// IO-TS as data runtime validator
import * as tt from "io-ts-types";
// Import plugin for IO-TS
import * as tPlugin from "./api/data/io-ts";
// Express as HTTP server
import * as express from "express";
// Import plugin from generic REST-related things to Koa framework
import * as expressPlugin from "./api/server/express";

// Create middleware in such way that IDs are valid UUID strings (instead of any strings).
// Any amount of endpoint informations can be passed to createKoaMiddleware - there always will be exactly one RegExp generated to perform endpoint match.
const performFunctionality = expressPlugin.createMiddleware(
  endpoints.createEndpoints(
    spec
      // Lock in to Koa and IO-TS
      .bindNecessaryTypes<
        server.HKTContextKind<expressPlugin.HKTContext, endpoints.State>,
        endpoints.State,
        tPlugin.ValidationError
      >((ctx) => ctx.res.locals),
    expressPlugin.validateContextState,
    // This is RFC-adhering UUID regex. Relax if needed.
    // Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    tt.UUID, // Too bad that io-ts-types does not expose UUID regex it uses (t.string as unknown as t.BrandC<t.StringC, never>),
  ),
);
// const middlewareFactory = server.middlewareFactory(
//   ...endpoints.createEndpoints(
//     // This is RFC-adhering UUID regex. Relax if needed.
//     // Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
//     /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i,
//     tt.UUID, // Too bad that io-ts-types does not expose UUID regex it uses (t.string as unknown as t.BrandC<t.StringC, never>),
//   ),
// );

const middleWareToSetUsernameFromBasicAuth = (): express.RequestHandler<
  Record<string, string>,
  any,
  any,
  Record<string, string>,
  endpoints.State
> => {
  return (req, res, next) => {
    const auth = req.get("authorization") ?? "";
    const scheme = auth.substring(0, 6).toLowerCase();
    let username: string | undefined;
    if (scheme.startsWith("basic ")) {
      try {
        const authData = Buffer.from(
          auth.substring(scheme.length),
          "base64",
        ).toString();
        const idx = authData.indexOf(":");
        if (idx > 0) {
          // Hardcoded creds, just because of sample
          if (
            authData.substring(0, idx) === "secret" &&
            authData.substring(idx + 1) === "secret"
          ) {
            username = authData.substring(0, idx);
          }
        }
      } catch {
        // Ignore, will return 403
      }
    }
    if (username) {
      res.locals.username = username;
    }
    next();
  };
};

// Instantiate application
// Create Express app
express
  .default()
  // First do auth (will modify context's state)
  .use(middleWareToSetUsernameFromBasicAuth())
  .use(performFunctionality)
  .listen(3000)
  .once("listening", () =>
    // eslint-disable-next-line no-console
    console.info("Koa server started"),
  );
