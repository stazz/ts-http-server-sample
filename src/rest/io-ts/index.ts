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

// IO-TS as data runtime validator
import * as t from "io-ts";
// Import plugin for IO-TS
import * as tPlugin from "../../api/data/io-ts";

import * as things from "./things";
import * as secret from "./secret";

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
          t.type(
            {
              [moduleApi.USERNAME]: t.string,
            },
            "AuthenticatedState", // Friendly name for error messages
          ),
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

    const idInBody = t.brand(
      t.string,
      (str): str is t.Branded<string, { readonly ID: unique symbol }> =>
        idRegex.test(str),
      "ID",
    );

    const endpointArgs = {
      idRegex,
      idInBody,
      data: {
        thing: t.type({ property: idInBody }),
      },
    };

    // Prefixes can be combined to any depth.
    // Note that it is technically possible and desireable to define prefixes in separate files, but for this sample, let's just define everything here.
    const thingsApi = prefix.atPrefix(
      "/thing",
      notAuthenticated.atURL``
        .batchSpec(things.getThings(endpointArgs))
        .batchSpec(things.createThing(endpointArgs))
        .createEndpoint({
          openapi: {
            summary: "Query things, or create thing",
          },
        }),
      notAuthenticated.atURL`/${"id"}`
        .validateURLData({
          // All parameters present in URL template string must be mentioned here, otherwise there will be compile-time error.
          id: tPlugin.urlParameter(tPlugin.parameterString(idInBody), idRegex),
        })
        .batchSpec(things.getThing(endpointArgs))
        .createEndpoint({
          openapi: {
            summary: "Get thing",
          },
        }),
      notAuthenticated.atURL`/${"id"}/connectToAnotherThing`
        .validateURLData({
          id: tPlugin.urlParameter(tPlugin.parameterString(idInBody), idRegex),
        })
        .batchSpec(things.connectThing(endpointArgs))
        .createEndpoint({
          openapi: {
            summary: "Connect two things",
          },
        }),
    );
    const secretApi = secret
      .accessSecret(authenticated.atURL`/secret`, endpointArgs)
      .createEndpoint({
        openapi: {},
      });

    const notAuthenticatedAPI = prefix.atPrefix("/api", thingsApi);
    const authenticatedAPI = prefix.atPrefix("/api", secretApi);
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
        tPlugin.outputValidator(t.UnknownRecord),
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

export default restModule;
