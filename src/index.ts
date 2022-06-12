// Import code to create REST API endpoints
import * as spec from "./api/core/spec";
import * as server from "./api/core/server";

import * as endpoints from "./rest-endpoints";
import * as logging from "./logging";

// Lock in our vendor choices:
// IO-TS as data runtime validator
import * as tt from "io-ts-types";
// Import plugin for IO-TS
import * as tPlugin from "./api/data/io-ts";
// Koa as HTTP server
import Koa from "koa";
// Import plugin from generic REST-related things to Koa framework
import * as koa from "./api/server/koa";

// Create middleware in such way that IDs are valid UUID strings (instead of any strings).
// Any amount of endpoint informations can be passed to createKoaMiddleware - there always will be exactly one RegExp generated to perform endpoint match.
const performFunctionality = koa.createMiddleware(
  endpoints.createEndpoints(
    spec
      // Lock in to Koa and IO-TS
      .bindNecessaryTypes<
        server.HKTContextKind<koa.HKTContext, endpoints.InitialState>,
        endpoints.InitialState,
        tPlugin.ValidationError
      >((ctx) => ctx.state),
    koa.validateContextState,
    // This is RFC-adhering UUID regex. Relax if needed.
    // Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    tt.UUID, // Too bad that io-ts-types does not expose UUID regex it uses (t.string as unknown as t.BrandC<t.StringC, never>),
  ),
  logging.logServerEvents(
    (ctx) => ({ method: ctx.method, url: ctx.url }),
    tPlugin.getHumanReadableErrorMessage,
  ),
);

const setUsernameFromBasicAuth = (): Koa.Middleware<endpoints.InitialState> => {
  return async (ctx, next) => {
    const auth = ctx.get("authorization");
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
      ctx.state.username = username;
    }
    await next();
  };
};

// Create Koa app
new Koa()
  // First do auth (will modify context's state)
  .use(setUsernameFromBasicAuth())
  // Then perform the REST API functionality
  .use(performFunctionality)
  // Listen to port 3000
  .listen(3000)
  // Inform that requests can now be sent
  .once("listening", () =>
    // eslint-disable-next-line no-console
    console.info("Koa server started"),
  );
