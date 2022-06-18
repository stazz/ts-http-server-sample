// Import generic REST-related things
import * as core from "../../api/core/core";
import * as spec from "../../api/core/spec";
import * as server from "../../api/core/server";
import * as prefix from "../../api/core/prefix";
// Import plugin for OpenAPI metadata
import * as openapi from "../../api/metadata/openapi";

// This module will be dynamically loaded - agree on the shape of the module.
import * as moduleApi from "../../module-api/rest";

// Import logging related common code
import * as logging from "../../logging";

// Import our REST-agnostic functionality
import * as functionality from "../../lib";

// Runtypes as data runtime validator
import * as t from "runtypes";
// Import plugin for Runtypes
import * as tPlugin from "../../api/data/runtypes";

// export interface EventArguments<TContextHKT extends server.HKTContext> {
//   getMethodAndUrl: logging.GetMethodAndURL<TContextHKT>;
//   builder?: evtEmit.EventEmitterBuilder<
//     server.VirtualRequestProcessingEvents<
//       server.HKTContextKind<TContextHKT, State>,
//       State,
//       tPlugin.ValidationError
//     >
//   >;
// }

const restModule: moduleApi.RESTAPISpecificationModule = {
  createEndpoints: (
    getStateFromContext,
    contextValidatorFactory,
    idRegexParam,
    getMethodAndUrl,
  ) => {
    const initial = spec.bindNecessaryTypes<
      server.HKTContextKind<
        moduleApi.GetContextHKT<typeof contextValidatorFactory>,
        moduleApi.State
      >,
      moduleApi.State,
      tPlugin.ValidationError
    >(getStateFromContext);
    const notAuthenticated = initial
      // All endpoints must specify enough metadata to be able to auto-generate OpenAPI specification
      .withMetadataProvider("openapi", openapi.createOpenAPIProvider());

    // Add validation that some previous middleware has set the username to Koa state.
    // Instruct validation to return error code 403 if no username has been set (= no auth).
    const authenticated = notAuthenticated.refineContext(
      contextValidatorFactory(
        tPlugin.plainValidator(
          t.Record({
            [moduleApi.USERNAME]: t.String,
          }),
        ),
        403,
      ),
      {
        openapi: {
          securitySchemes: [
            {
              name: "authentication",
              scheme: {
                type: "http",
                scheme: "basic",
              },
            },
          ],
        },
      },
    );

    // We must make this const, as we have to use it inside lambda
    const idRegex = idRegexParam ?? core.defaultParameterRegExp();

    const idInBody = t.String.withConstraint(
      (str) => idRegex.test(str) || "The IDs must be in valid format.", // TODO check that the match is same as whole string, since original string misses begin & end marks (as they would confuse URL regexp)
    ).withBrand("ID");

    // Prefixes can be combined to any depth.
    // Note that it is technically possible and desireable to define prefixes in separate files, but for this sample, let's just define everything here.
    const things = prefix.atPrefix(
      "/thing",
      // Endpoint: query thing by ID.
      notAuthenticated.atURL`/${"id"}`
        .validateURLData({
          // All parameters present in URL template string must be mentioned here, otherwise there will be compile-time error.
          id: tPlugin.urlParameter(tPlugin.parameterString(idInBody), idRegex),
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
          tPlugin.outputValidator(t.String),
          // Metadata about endpoint (as dictated by "withMetadataProvider" above)
          {
            openapi: {
              operation: { summary: "Query a thing" },
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
              body: undefined,
              output: {
                description: "Output description",
                mediaTypes: {
                  "application/json": {
                    example: "Example",
                  },
                },
              },
            },
          },
        )
        .createEndpoint({
          openapi: {
            summary: "Read things",
          },
        }),
      // Endpoint: create thing with some property set.
      notAuthenticated.atURL``
        .forMethod("PUT")
        .withBody(
          // Body validator (will be called on JSON-parsed entity)
          tPlugin.inputValidator(
            t.Record({
              property: idInBody,
            }),
          ),
          // Request handler
          ({ body: { property } }) => functionality.createThing(property),
          // Transform functionality output to REST output
          tPlugin.outputValidator(
            t.Record({
              property: t.String,
            }),
          ),
          // Metadata about endpoint (as dictated by "withMetadataProvider" above)
          {
            openapi: {
              operation: { summary: "Create a thing" },
              urlParameters: undefined,
              body: {
                "application/json": {
                  example: {
                    property: decodeOrThrow(
                      idInBody,
                      "00000000-0000-0000-0000-000000000000",
                    ),
                  },
                },
              },
              queryParameters: undefined,
              output: {
                description: "Output description",
                mediaTypes: {
                  "application/json": {
                    example: {
                      property: "00000000-0000-0000-0000-000000000000",
                    },
                  },
                },
              },
            },
          },
        )
        .createEndpoint({
          openapi: {
            summary: "Manipulate a thing",
          },
        }),
      // Endpoint: connect thing to another thing.
      notAuthenticated.atURL`/${"id"}/connectToAnotherThing`
        .validateURLData({
          id: tPlugin.urlParameter(tPlugin.parameterString(idInBody), idRegex),
        })
        .forMethod("POST")
        .withBody(
          // Body validator (will be called on JSON-parsed entity)
          tPlugin.inputValidator(
            t.Record({
              anotherThingId: idInBody,
            }),
          ),
          ({ url: { id }, body: { anotherThingId } }) =>
            functionality.connectToAnotherThing(id, anotherThingId),
          // Transform functionality output to REST output
          tPlugin.outputValidator(
            t.Record({
              connected: t.Boolean,
              connectedAt: t.InstanceOf(Date),
            }),
          ),
          // Metadata about endpoint (as dictated by "withMetadataProvider" above)
          {
            openapi: {
              operation: { summary: "Connect one thing to another" },
              urlParameters: {
                id: {
                  description: "ID description",
                },
              },
              queryParameters: undefined,
              body: {
                "application/json": {
                  example: {
                    anotherThingId: decodeOrThrow(
                      idInBody,
                      "00000000-0000-0000-0000-000000000000",
                    ),
                  },
                },
              },
              output: {
                description: "Output description",
                mediaTypes: {
                  "application/json": {
                    example: {
                      connected: true,
                      connectedAt: new Date(0),
                    },
                  },
                },
              },
            },
          },
        )
        .createEndpoint({
          openapi: {
            summary: "Manipulate many things",
          },
        }),
    );
    const secret = authenticated.atURL`/secret`
      .forMethod("GET")
      .withoutBody(
        ({ state: { username } }) =>
          functionality.doAuthenticatedAction(username),
        tPlugin.outputValidator(t.Void),
        {
          openapi: {
            urlParameters: undefined,
            queryParameters: undefined,
            body: undefined,
            operation: {},
            output: {
              description: "No data in output",
              mediaTypes: {
                "application/json": {},
              },
            },
          },
        },
      )
      .createEndpoint({
        openapi: {},
      });

    const notAuthenticatedAPI = prefix.atPrefix("/api", things);
    const authenticatedAPI = prefix.atPrefix("/api", secret);
    const notAuthenticatedMetadata = notAuthenticated.getMetadataFinalResult(
      {
        openapi: {
          title: "Sample REST API (Authenticated)",
          version: "0.1",
        },
      },
      [notAuthenticatedAPI.getMetadata("")],
    ).openapi;
    const authenticatedMetadata = authenticated.getMetadataFinalResult(
      {
        openapi: {
          title: "Sample REST API",
          version: "0.1",
        },
      },
      [notAuthenticatedAPI.getMetadata(""), authenticatedAPI.getMetadata("")],
    ).openapi;

    // OpenAPI JSON endpoint
    const docs = initial.atURL`/api-md`
      .forMethod("GET")
      .withoutBody(
        ({ state: { username } }) => {
          return username ? authenticatedMetadata : notAuthenticatedMetadata;
        },
        // Proper validator for OpenAPI objects is out of scope of this sample
        tPlugin.outputValidator(t.Dictionary(t.Unknown)),
        // No metadata - as this is the metadata-returning endpoints itself
        {},
      )
      .createEndpoint({});

    return {
      api: [notAuthenticatedAPI, authenticatedAPI, docs],
      events: logging.logServerEvents<
        moduleApi.GetContextHKT<typeof contextValidatorFactory>,
        moduleApi.State,
        tPlugin.ValidationError
      >(
        getMethodAndUrl,
        ({ username }) => `(user: ${username})`,
        tPlugin.getHumanReadableErrorMessage,
      ),
    };
  },
};

const decodeOrThrow = <T>(validate: tPlugin.Decoder<T>, value: unknown) => {
  return validate.check(value);
};

export default restModule;
