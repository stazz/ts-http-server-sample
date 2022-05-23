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

// This is just a dummy for demonstration purposes
const koaState = t.type(
  {
    username: t.string,
  },
  "KoaState", // Friendly name for error messages
);
type KoaState = t.TypeOf<typeof koaState>;
// Function to create REST API specification, utilizing generic REST API things in ./api and our functionality in ./lib.
const endpointsAsKoaMiddleware = (
  idInURL?: model.URLDataTransformer<string>,
  idInBody?: t.BrandC<t.StringC, unknown>,
) => {
  if (!idInURL) {
    idInURL = model.defaultParameter();
  }
  if (!idInBody) {
    idInBody = t.string as unknown as t.BrandC<t.StringC, never>;
  }
  const urlBuilder = model.bindNecessaryTypes<
    tPlugin.ValidationError,
    koa.KoaContext<KoaState>
  >();
  // Any amount of endpoint informations can be passed to createKoaMiddleware - there always will be exactly one RegExp generated to perform endpoint match.
  return koa.koaMiddlewareFactory(
    tPlugin.validatorFromType(koaState),
    // Prefixes can be combined to any depth.
    // Note that it is technically possible to define prefixes in separate files, but for this sample, let's just define everything here.
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
            tPlugin.validatorFromType(t.string),
          ),
        // Endpoint: create thing with some property set.
        urlBuilder.atURL``.withBody(
          // Body validator (will be called on JSON-parsed entity)
          tPlugin.validatorFromType(
            t.type(
              {
                property: idInBody,
              },
              "CreateThingBody", // Friendly name for error messages
            ),
          ),
          // Request handler
          (_, { property }) => functionality.createThing(property),
          // Transform functionality output to REST output
          tPlugin.validatorFromType(
            t.type(
              {
                property: idInBody,
              },
              "CreateThingOutput", // Friendly name for error messages
            ),
          ),
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
            tPlugin.validatorFromType(
              t.type(
                {
                  anotherThingId: idInBody,
                },
                "ConnectThingBody", // Friendly name for error messages
              ),
            ),
            ({ id }, { anotherThingId }) =>
              functionality.connectToAnotherThing(id, anotherThingId),
            // Transform functionality output to REST output
            tPlugin.validatorFromType(
              t.type(
                {
                  connected: t.boolean,
                  // TODO this needs to be used as encoder, actually
                  //connectedAt: tt.DateFromISOString,
                },
                "ConnectThingOutput", // Friendly name for error messages
              ),
            ),
          ),
      ),
    ),
    // Endpoint: (fake) API docs
    urlBuilder.atURL`/doc`.withoutBody(
      () => "This is our documentation",
      tPlugin.validatorFromType(t.string),
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
  tt.UUID,
);

const middleWareToSetUsernameFromJWTToken = (): Koa.Middleware<KoaState> => {
  // Simulate lazy fetching of JWT info from remote server.
  let jwtInfo: Promise<string> | undefined;
  const fetchJwtInfo = () => Promise.resolve("get-jwt-info-from-some-url");
  return async (ctx, next) => {
    if (!jwtInfo) {
      jwtInfo = fetchJwtInfo();
    }
    await fetchJwtInfo(); // Once awaited, the Promise will not be executed again. It is safe to await on already awaited Promise.
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
    middlewareFactory.createMiddleware({
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
      onInvalidMethod: ({ ctx: { state, method, url } }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Invalid Method supplied: ${method} ${url} (user: ${state.username})`,
        );
      },
      onBodyJSONParseError: ({ ctx: { state, method, url }, exception }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to parse body JSON ${method} ${url} (user: ${state.username})\n${exception}`,
        );
      },
      onInvalidKoaState: ({ ctx: { state }, validationError }) => {
        // eslint-disable-next-line no-console
        console.error(
          `Internal error: state validation failed for ${JSON.stringify(
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
    }),
  )
  .listen(3000)
  .once("listening", () =>
    // eslint-disable-next-line no-console
    console.info("Koa server started"),
  );
