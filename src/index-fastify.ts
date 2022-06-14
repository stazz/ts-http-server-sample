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
// Express as HTTP server
import * as fastify from "fastify";
// Import plugin from generic REST-related things to Koa framework
import * as fastifyPlugin from "./api/server/fastify";

// Create middleware in such way that IDs are valid UUID strings (instead of any strings).
// Any amount of endpoint informations can be passed to createKoaMiddleware - there always will be exactly one RegExp generated to perform endpoint match.
const performFunctionality = fastifyPlugin.createRoute(
  endpoints.createEndpoints(
    spec
      // Lock in to Fastify and IO-TS
      .bindNecessaryTypes<
        server.HKTContextKind<fastifyPlugin.HKTContext, endpoints.State>,
        endpoints.State,
        tPlugin.ValidationError
      >(fastifyPlugin.getStateFromContext),
    fastifyPlugin.validateContextState,
    // This is RFC-adhering UUID regex. Relax if needed.
    // Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    tt.UUID, // Too bad that io-ts-types does not expose UUID regex it uses (t.string as unknown as t.BrandC<t.StringC, never>),
  ),
  {},
  logging.logServerEvents(
    ({ req }) => ({
      method: req.method ?? "<no method>",
      url: req.originalUrl ?? req.url ?? "<no url>",
    }),
    tPlugin.getHumanReadableErrorMessage,
  ),
);

const middleWareToSetUsernameFromBasicAuth =
  (): fastify.onRequestHookHandler => {
    return (req, res, done) => {
      const auth = req.headers["authorization"] ?? "";
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
        const usernameConst = username;
        fastifyPlugin.modifyState<endpoints.State>(
          req.raw,
          {},
          (state) => (state.username = usernameConst),
        );
      }
      done();
    };
  };

const main = async () => {
  // Create Fastify app
  const server = fastify
    .default
    //{ logger: { level: "info" } }
    ();
  // Register the functionality callback, and also remember the handler to set username from auth
  fastifyPlugin.registerRouteToFastifyInstance(server, performFunctionality, {
    onRequest: middleWareToSetUsernameFromBasicAuth(),
  });
  await server
    // Start on given port
    .listen({ port: 3000, host: "0.0.0.0" });
  // Inform that requests can now be sent
  // eslint-disable-next-line no-console
  console.info(`Fastify server started`);
};

void main();
