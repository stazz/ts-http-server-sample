// Import code to create REST API endpoints
import * as spec from "./api/core/spec";
import * as endpoints from "./rest-endpoints";

// Lock in our vendor choices:
// IO-TS as data runtime validator
import * as tt from "io-ts-types";
// Import plugin for IO-TS
import * as tPlugin from "./api/data/io-ts";
// Express as HTTP server
import * as express from "express";
// Import plugin from generic REST-related things to Koa framework
import * as server from "./api/server/express";

// Create middleware in such way that IDs are valid UUID strings (instead of any strings).
// Any amount of endpoint informations can be passed to createKoaMiddleware - there always will be exactly one RegExp generated to perform endpoint match.
const middlewareFactory = server.middlewareFactory(
  ...endpoints.createEndpoints<server.HKTContext>(
    spec
      // Lock in to Koa and IO-TS
      .bindNecessaryTypes<
        server.HKTContext,
        Partial<endpoints.State>,
        tPlugin.ValidationError
      >((ctx) => ctx.res.locals),
    server.validateContextState,
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
  Partial<endpoints.State>
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
middlewareFactory
  .use<Partial<endpoints.State>>(
    // Create Express app
    express
      .default()
      // First do auth (will modify context's state)
      .use(middleWareToSetUsernameFromBasicAuth()),
    // Hook up to events of the applications
    {
      onInvalidBody: ({
        state,
        ctx: {
          req: { method, url },
        },
        validationError,
      }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid body: ${method} ${url} (user: ${
            state.username
          }), validation error:\n${tPlugin.getHumanReadableErrorMessage(
            validationError,
          )}`,
        );
      },
      onInvalidUrl: ({
        ctx: {
          req: { method, url },
          res: { locals: state },
        },
      }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid URL supplied: ${method} ${url} (user: ${state.username})`,
        );
      },
      onInvalidUrlParameters: ({
        ctx: {
          req: { method, url },
        },
        validationError,
      }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid URL parameters supplied: ${method} ${url}.\n${validationError
            .map((error) => tPlugin.getHumanReadableErrorMessage(error))
            .join("  \n")}`,
        );
      },
      onInvalidQuery: ({
        ctx: {
          req: { method, url },
        },
        validationError,
      }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid query supplied: ${method} ${url}.\n${tPlugin.getHumanReadableErrorMessage(
            validationError,
          )}`,
        );
      },
      onInvalidMethod: ({
        ctx: {
          req: { method, url },
          res: { locals: state },
        },
      }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid Method supplied: ${method} ${url} (user: ${state.username})`,
        );
      },
      onInvalidContentType: ({
        state,
        ctx: {
          req: { method, url },
        },
        contentType,
      }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid content type specified: ${method} ${url} (user: ${state.username}): ${contentType}`,
        );
      },
      onInvalidContext: ({
        ctx: {
          res: { locals: state },
        },
        validationError,
      }) => {
        // eslint-disable-next-line no-console
        console.error(
          `State validation failed for ${JSON.stringify(state)}.\n${
            validationError
              ? tPlugin.getHumanReadableErrorMessage(validationError)
              : "Protocol-related error"
          }`,
        );
      },
      onInvalidResponse: ({
        state,
        ctx: {
          req: { method, url },
        },
        validationError,
      }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid response: ${method} ${url} (user: ${
            state.username
          }), validation error:\n${tPlugin.getHumanReadableErrorMessage(
            validationError,
          )}`,
        );
      },
    },
  )
  .listen(3000)
  .once("listening", () =>
    // eslint-disable-next-line no-console
    console.info("Koa server started"),
  );
