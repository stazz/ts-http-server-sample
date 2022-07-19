// Import generic REST-related things
import * as data from "../../api/core/data-server";
import * as spec from "../../api/core/spec";
import * as server from "../../api/core/server";
import * as prefix from "../../api/core/prefix";
// Import plugin for OpenAPI metadata
import * as openapi from "../../api/metadata/openapi";

// This module will be dynamically loaded - agree on the shape of the module.
import * as moduleApi from "../../module-api/rest";

// IO-TS as data runtime validator
import * as t from "io-ts";
// Import plugin for IO-TS
import * as tPlugin from "../../api/data-server/io-ts";

import * as api from "./api";

const restModule: moduleApi.RESTAPISpecificationModule = {
  createEndpoints: (
    getStateFromContext,
    contextValidatorFactory,
    idRegexParam,
  ) => {
    const initial = spec.bindNecessaryTypes<
      server.HKTContextKind<
        moduleApi.GetContextHKT<typeof contextValidatorFactory>,
        moduleApi.State
      >,
      moduleApi.State
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
    const idRegex = idRegexParam ?? data.defaultParameterRegExp();

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

    const things = prefix.atPrefix(
      "/thing",
      notAuthenticated.atURL``
        .batchSpec(api.getThings(endpointArgs))
        .batchSpec(api.createThing(endpointArgs))
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
        .batchSpec(api.getThing(endpointArgs))
        .createEndpoint({
          openapi: {
            summary: "Get thing",
          },
        }),
      notAuthenticated.atURL`/${"id"}/connectToAnotherThing`
        .validateURLData({
          id: tPlugin.urlParameter(tPlugin.parameterString(idInBody), idRegex),
        })
        .batchSpec(api.connectThing(endpointArgs))
        .createEndpoint({
          openapi: {
            summary: "Connect two things",
          },
        }),
    );

    const secret = authenticated.atURL`/secret`
      .batchSpec(api.accessSecret(endpointArgs))
      .createEndpoint({ openapi: {} });

    // Prefixes can be combined to any depth.
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
        tPlugin.outputValidator(t.UnknownRecord),
        // No metadata - as this is the metadata-returning endpoints itself
        {},
      )
      .createEndpoint({});

    return {
      api: [notAuthenticatedAPI, authenticatedAPI, docs],
    };
  },
};

export default restModule;
