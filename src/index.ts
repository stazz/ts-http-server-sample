// Import generic REST-related things
import * as model from "./api/model";
// Import our REST-agnostic functionality
import * as functionality from "./lib";

// Lock in our vendor choices:
// IO-TS as data runtime validator
import * as t from "io-ts";
import * as tt from "io-ts-types";
// Import plugin for IO-TS
import * as tPlugin from "./api/plugins/io-ts";
// Koa as HTTP server
import Koa from "koa";
// Import plugin from generic REST-related things to Koa framework
import * as koa from "./api/plugins/koa";

// Glue between generic REST API things in ./api and our functionality in ./lib
const urlBuilder = model.bindValidationType<tPlugin.ValidationError>();
const endpointsAsKoaMiddleware = (
  idInURL?: model.URLDataTransformer<string>,
  idInBody?: t.Type<string>,
) => {
  if (!idInURL) {
    idInURL = model.defaultParameter();
  }
  if (!idInBody) {
    idInBody = t.string;
  }
  // Any amount of endpoint informations can be passed to createKoaMiddleware - there always will be exactly one RegExp generated to perform endpoint match.
  return koa.koaMiddlewareFactory(
    // Prefixes can be combined to any depth.
    model.atPrefix(
      "/api",
      model.atPrefix(
        "/thing",
        // Endpoint: query thing by ID.
        urlBuilder.atURL`/${"id"}`
          .validateURLData({
            // All parameters present in URL template string must be mentioned here, otherwise there will be compile-time error.
            id: idInURL,
          })
          .withoutBody(
            // Invoke functionality
            ({ id }) => functionality.queryThing(id),
            // Transform functionality output to REST output
            t.string.encode,
          ),
        // Endpoint: create thing with some property set.
        urlBuilder.atURL``.withBody(
          // Body validator (will be called on JSON-parsed entity)
          tPlugin.bodyValidatorFromType(
            t.type(
              {
                property: idInBody,
              },
              "CreateThingBody", // Friendly name for error messages
            ).decode,
          ),
          // Request handler
          (_, { property }) => functionality.createThing(property),
          // Transform functionality output to REST output
          t.type(
            {
              property: idInBody,
            },
            "CreateThingOutput", // Friendly name for error messages
          ).encode,
          // Optional accepted methods (default just "POST")
          "PUT",
        ),
        // Endpoint: connect thing to another thing.
        urlBuilder.atURL`/${"id"}/connectToAnotherThing`
          .validateURLData({
            id: idInURL,
          })
          .withBody(
            // Body validator (will be called on JSON-parsed entity)
            tPlugin.bodyValidatorFromType(
              t.type(
                {
                  anotherThingId: idInBody,
                },
                "ConnectThingBody", // Friendly name for error messages
              ).decode,
            ),
            ({ id }, { anotherThingId }) =>
              functionality.connectToAnotherThing(id, anotherThingId),
            // Transform functionality output to REST output
            t.type(
              {
                connected: t.boolean,
                connectedAt: tt.DateFromISOString,
              },
              "ConnectThingOutput", // Friendly name for error messages
            ).encode,
          ),
      ),
    ),
    // Endpoint: (fake) API docs
    urlBuilder.atURL`/doc`.withoutBody(
      () => "This is our documentation",
      (output) => t.string.encode(output),
    ),
  );
};

// This is RFC-adhering UUID regex. Relax if needed.
// Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
const uuidRegex =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i;
// Create middleware in such way that IDs are valid UUID strings (instead of any strings).
const middlewareFactory = endpointsAsKoaMiddleware(
  model.regexpParameter(uuidRegex),
  t.refinement(
    t.string,
    (str) => uuidRegex.exec(str) !== null,
    "UUID", // Friendly name for error messages
  ),
);

// This is just a dummy for demonstration purposes
type KoaState = Partial<{ username: string }>;
const middleWareToSetUsernameFromJWTToken = (): Koa.Middleware<KoaState> => {
  // Simulate lazy fetching of JWT info from remote server.
  let jwtInfo: Promise<string> | undefined;
  const fetchJwtInfo = () => Promise.resolve("get-jwt-info-from-some-url");
  return async (ctx, next) => {
    if (!jwtInfo) {
      jwtInfo = fetchJwtInfo();
    }
    await fetchJwtInfo(); // Once awaited, the Promise will not be executed again.
    ctx.state.username = "username-from-jwt-token-or-error";
    await next();
  };
};

// Finally, create Koa app and start it
new Koa<KoaState>()
  // First do auth (will modify context's state)
  .use(middleWareToSetUsernameFromJWTToken())
  // Then perform our task (read context's state in event handler)
  .use(
    middlewareFactory.createMiddleware<KoaState>({
      onInvalidBody: ({ ctx: { state, method, url }, validationError }) => {
        // eslint-disable-next-line no-console
        console.info(
          `Invalid body: ${method} ${url} (user: ${
            state.username
          }), validation error:\n${tPlugin.getHumanReadableErrorMessage(
            validationError,
          )}`,
        );
      },
      onInvalidUrl: ({ ctx: { state, method, url } }) => {
        // eslint-disable-next-line no-console
        console.info(
          `Invalid URL supplied: ${method} ${url} (user: ${state.username})`,
        );
      },
      onInvalidMethod: ({ ctx: { state, method, url } }) => {
        // eslint-disable-next-line no-console
        console.info(
          `Invalid Method supplied: ${method} ${url} (user: ${state.username})`,
        );
      },
      onBodyJSONParseError: ({ ctx: { state, method, url }, exception }) => {
        // eslint-disable-next-line no-console
        console.info(
          `Failed to parse body JSON ${method} ${url} (user: ${state.username})\n${exception}`,
        );
      },
    }),
  )
  .listen(3000)
  .once("listening", () =>
    // eslint-disable-next-line no-console
    console.info("Koa server started"),
  );
