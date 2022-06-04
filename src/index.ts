// Import code to create REST API endpoints
import * as endpoints from "./rest-endpoints";

// Lock in our vendor choices:
// IO-TS as data runtime validator
import * as tt from "io-ts-types";
// Import plugin for IO-TS
import * as tPlugin from "./api/data/io-ts";
// Koa as HTTP server
import Koa from "koa";
// Import plugin from generic REST-related things to Koa framework
import * as koa from "./api/server/koa";

// This is RFC-adhering UUID regex. Relax if needed.
// Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
const uuidRegex =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i;
// Create middleware in such way that IDs are valid UUID strings (instead of any strings).
const middlewareFactory = koa.koaMiddlewareFactory(
  ...endpoints.createEndpoints(
    uuidRegex,
    tt.UUID, // Too bad that io-ts-types does not expose UUID regex it uses (t.string as unknown as t.BrandC<t.StringC, never>),
  ),
);

const middleWareToSetUsernameFromJWTToken = (): Koa.Middleware<
  Partial<endpoints.KoaState>
> => {
  // Simulate lazy fetching of JWT info from remote server.
  let jwtInfo: Promise<string> | undefined;
  const fetchJwtInfo = () => Promise.resolve("get-jwt-info-from-some-url");
  return async (ctx, next) => {
    if (!jwtInfo) {
      jwtInfo = fetchJwtInfo();
    }
    await fetchJwtInfo(); // Once awaited, the Promise will not be executed again. It is safe to await on already awaited Promise.
    ctx.state.username = "username-from-jwt-token-or-none";
    await next();
  };
};

// Instantiate application
middlewareFactory
  .use(
    // Create Koa app
    new Koa()
      // First do auth (will modify context's state)
      .use(middleWareToSetUsernameFromJWTToken()),
    // Hook up to events of the applications
    {
      onInvalidBody: ({ ctx: { state, method, url }, validationError }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid body: ${method} ${url} (user: ${
            state.username
          }), validation error:\n${tPlugin.getHumanReadableErrorMessage(
            validationError,
          )}`,
        );
      },
      onInvalidUrl: ({ ctx: { state, method, url } }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid URL supplied: ${method} ${url} (user: ${state.username})`,
        );
      },
      onInvalidUrlParameters: ({ ctx: { method, url }, validationError }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid URL parameters supplied: ${method} ${url}.\n${validationError
            .map((error) => tPlugin.getHumanReadableErrorMessage(error))
            .join("  \n")}`,
        );
      },
      onInvalidQuery: ({ ctx: { method, url }, validationError }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid query supplied: ${method} ${url}.\n${tPlugin.getHumanReadableErrorMessage(
            validationError,
          )}`,
        );
      },
      onInvalidMethod: ({ ctx: { state, method, url } }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid Method supplied: ${method} ${url} (user: ${state.username})`,
        );
      },
      onInvalidContentType: ({ ctx: { state, method, url }, contentType }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid content type specified: ${method} ${url} (user: ${state.username}): ${contentType}`,
        );
      },
      onInvalidContext: ({ ctx: { state }, validationError }) => {
        // eslint-disable-next-line no-console
        console.error(
          `State validation failed for ${JSON.stringify(
            state,
          )}.\n${tPlugin.getHumanReadableErrorMessage(validationError)}`,
        );
      },
      onInvalidResponse: ({ ctx: { state, method, url }, validationError }) => {
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
