// Import code to create REST API endpoints
import * as spec from "./api/core/spec";
import * as server from "./api/core/server";

import * as endpoints from "./rest-endpoints-zod";
import * as logging from "./logging";

// Lock in our vendor choices:
// Zod as data runtime validator
import * as t from "zod";
import * as tPlugin from "./api/data/zod";
// Express as HTTP server
import * as express from "express";
import type * as expressCore from "express-serve-static-core";
// Import plugin from generic REST-related things to Koa framework
import * as expressPlugin from "./api/server/express";

// Create middleware in such way that IDs are valid UUID strings (instead of any strings).
// Any amount of endpoint informations can be passed to createKoaMiddleware - there always will be exactly one RegExp generated to perform endpoint match.
const uuidRegex =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i;
const performFunctionality = expressPlugin.createMiddleware(
  endpoints.createEndpoints(
    spec
      // Lock in to ExpressJS and IO-TS
      .bindNecessaryTypes<
        server.HKTContextKind<expressPlugin.HKTContext, endpoints.State>,
        endpoints.State,
        tPlugin.ValidationError
      >((ctx) => ctx.res.locals),
    expressPlugin.validateContextState,
    // This is RFC-adhering UUID regex. Relax if needed.
    // Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    t.string().refine(
      (str) => uuidRegex.test(str), // TODO check that the match is same as whole string, since original string misses begin & end marks (as they would confuse URL regexp)
      "The IDs must be in valid UUID format.",
    ),
  ),
  logging.logServerEvents(
    ({ req }) => ({ method: req.method, url: req.originalUrl }),
    ({ username }) => `(user: ${username})`,
    tPlugin.getHumanReadableErrorMessage,
  ),
);

const middleWareToSetUsernameFromBasicAuth = (): express.RequestHandler<
  expressCore.ParamsDictionary,
  unknown,
  unknown,
  expressCore.Query,
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
  // Then perform the REST API functionality
  .use(performFunctionality)
  // Listen to port 3000
  .listen(3000)
  // Inform that requests can now be sent
  .once("listening", () =>
    // eslint-disable-next-line no-console
    console.info("ExpressJS server started"),
  );
