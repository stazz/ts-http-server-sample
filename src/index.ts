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
  idRegex: RegExp,
  idInBody?: t.BrandC<t.StringC, unknown>,
) => {
  if (!idInBody) {
    idInBody = t.string as unknown as t.BrandC<t.StringC, never>;
  }
  const urlBuilder = model
    // Lock in to Koa and IO-TS
    .bindNecessaryTypes<koa.KoaContext, tPlugin.ValidationError>()
    // All endpoints must specify enough metadata to be able to auto-generate OpenAPI specification
    .withMetadataProvider("openapi", model.openApiProvider);

  const urlBuilderWithUsername = urlBuilder.refineContext(
    koa.validateContextState(tPlugin.plainValidator(koaState)),
    // TODO actually specify securityScehemes.
    {
      openapi: {
        securitySchemes: [],
      },
    },
  );
  // Any amount of endpoint informations can be passed to createKoaMiddleware - there always will be exactly one RegExp generated to perform endpoint match.
  return koa.koaMiddlewareFactory(
    // Prefixes can be combined to any depth.
    // Note that it is technically possible to define prefixes in separate files, but for this sample, let's just define everything here.
    model.atPrefix(
      "/api",
      model.atPrefix(
        "/thing",
        // Endpoint: query thing by ID.
        urlBuilderWithUsername.atURL`/${"id"}`
          .validateURLData({
            // All parameters present in URL template string must be mentioned here, otherwise there will be compile-time error.
            id: tPlugin.urlParameter(
              tPlugin.parameterString(idInBody),
              idRegex,
            ),
          })
          .forMethod(
            "GET",
            tPlugin.queryValidator({
              required: [],
              optional: ["includeDeleted"],
              validation: {
                includeDeleted: tPlugin.parameterBoolean(),
              },
            }),
          )
          .withoutBody(
            // Invoke functionality
            ({ url: { id }, query: { includeDeleted } }) =>
              functionality.queryThing(id, includeDeleted === true),
            // Transform functionality output to REST output
            tPlugin.outputValidator(t.string),
            // Metadata
            {
              openapi: {
                urlParameters: {
                  id: {
                    description: "ID description",
                  },
                },
                queryParameters: {
                  includeDeleted: {
                    description: "Include deleted description",
                  },
                },
                outputDescription: "Output description",
                outputInfo: {
                  "application/json": {
                    encoding: "UTF8",
                  },
                },
              },
            },
          )
          .createEndpoint(),
        // Endpoint: create thing with some property set.
        urlBuilderWithUsername.atURL``
          .forMethod("PUT")
          .withBody(
            // Body validator (will be called on JSON-parsed entity)
            tPlugin.inputValidator(
              t.type(
                {
                  property: idInBody,
                },
                "CreateThingBody", // Friendly name for error messages
              ),
            ),
            // Request handler
            ({
              body: { property },
              context: {
                state: { username },
              },
            }) => functionality.createThing(property, username),
            // Transform functionality output to REST output
            tPlugin.outputValidator(
              t.type(
                {
                  property: t.string,
                },
                "CreateThingOutput", // Friendly name for error messages
              ),
            ),
            {
              openapi: {
                urlParameters: undefined,
                queryParameters: {},
                outputDescription: "Output description",
                outputInfo: {
                  "application/json": {
                    encoding: "UTF8",
                  },
                },
              },
            },
          )
          .createEndpoint(),
        // Endpoint: connect thing to another thing.
        urlBuilderWithUsername.atURL`/${"id"}/connectToAnotherThing`
          .validateURLData({
            id: tPlugin.urlParameter(
              tPlugin.parameterString(idInBody),
              idRegex,
            ),
          })
          .forMethod("POST")
          .withBody(
            // Body validator (will be called on JSON-parsed entity)
            tPlugin.inputValidator(
              t.type(
                {
                  anotherThingId: idInBody,
                },
                "ConnectThingBody", // Friendly name for error messages
              ),
            ),
            ({ url: { id }, body: { anotherThingId } }) =>
              functionality.connectToAnotherThing(id, anotherThingId),
            // Transform functionality output to REST output
            tPlugin.outputValidator(
              t.type(
                {
                  connected: t.boolean,
                  connectedAt: tt.DateFromISOString,
                },
                "ConnectThingOutput", // Friendly name for error messages
              ),
            ),
            {
              openapi: {
                urlParameters: {
                  id: {
                    description: "ID description",
                  },
                },
                queryParameters: {},
                outputDescription: "Output description",
                outputInfo: {
                  "application/json": {
                    encoding: "UTF8",
                  },
                },
              },
            },
          )
          .createEndpoint(),
      ),
    ),
    // Endpoint: (fake) API docs
    urlBuilder.atURL`/doc`
      .forMethod("GET")
      .withoutBody(
        () => "This is our documentation",
        tPlugin.outputValidator(t.string),
        {
          openapi: {
            urlParameters: undefined,
            queryParameters: {},
            outputDescription: "Output description",
            outputInfo: {
              "application/json": {
                encoding: "UTF8",
              },
            },
          },
        },
      )
      .createEndpoint(),
  );
};

// This is RFC-adhering UUID regex. Relax if needed.
// Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
const uuidRegex =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i;
// Create middleware in such way that IDs are valid UUID strings (instead of any strings).
const middlewareFactory = endpointsAsKoaMiddleware(
  uuidRegex,
  tt.UUID, // Too bad that io-ts-types does not expose UUID regex it uses
);

const middleWareToSetUsernameFromJWTToken = (): Koa.Middleware<
  Partial<KoaState>
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
