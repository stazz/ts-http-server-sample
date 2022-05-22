// Import generic REST-related things
import * as model from "./api/model";
// Import our REST-agnostic functionality
import * as functionality from "./lib";

// Lock in our vendor choices:
// IO-TS as data runtime validator
import * as t from "io-ts";
import * as tt from "io-ts-types";
// Koa as HTTP server
import Koa from "koa";
// Import plugin from generic REST-related things to Koa framework
import * as koa from "./api/plugins/koa";

// Glue between generic REST API things in ./api and our functionality in ./lib
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
  return koa.createKoaMiddleware(
    // Prefixes can be combined to any depth.
    model.atPrefix(
      "/api",
      model.atPrefix(
        "/thing",
        // If anything else than string is used in atURL template string, there will be compile-time error.
        // If string mentioned in template will be changed, there will be compile-time error.
        model.atURL`/${"id"}`
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
        model.atURL``.withBody(
          // Body validator (will be called on JSON-parsed entity)
          t.type({
            property: idInBody,
          }).is,
          // Request handler
          (_, { property }) => functionality.createThing(property),
          // Transform functionality output to REST output
          t.type({
            property: idInBody,
          }).encode,
          // Optional accepted methods (default just "POST")
          "PUT",
        ),
        // URL parameters and body validations can be combined
        model.atURL`/${"id"}/connectToAnotherThing`
          .validateURLData({
            id: idInURL,
          })
          .withBody(
            // Body validator (will be called on JSON-parsed entity)
            t.type({
              anotherThingId: idInBody,
            }).is,
            ({ id }, { anotherThingId }) =>
              functionality.connectToAnotherThing(id, anotherThingId),
            // Transform functionality output to REST output
            t.type({
              connected: t.boolean,
              connectedAt: tt.DateFromISOString,
            }).encode,
          ),
      ),
    ),
    model.atURL`/doc`.withoutBody(
      () => "This is our documentation",
      (output) => t.string.encode(output),
    ),
  );
};

// This is RFC-adhering UUID regex. Relax if needed.
// Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
const uuidRegex =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i;
// Create our app in such way that IDs are valid UUID strings (instead of any strings).
const middleware = endpointsAsKoaMiddleware(
  model.regexpParameter(uuidRegex),
  t.refinement(t.string, (str) => uuidRegex.exec(str) !== null),
);

// Finally, create Koa app and start it
new Koa().use(middleware).listen(3000);
