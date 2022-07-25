// Import generic REST-related things
import * as data from "../../api/core/data-server";
import * as ep from "../../api/core/endpoint";
import * as spec from "../../api/core/spec";
import * as server from "../../api/core/server";
import * as prefix from "../../api/core/prefix";
// Import plugin for OpenAPI metadata
import * as openapi from "../../api/metadata/openapi";

// This module will be dynamically loaded - agree on the shape of the module.
import type * as moduleApi from "../../module-api/rest";

// Zod as data runtime validator
import * as t from "zod";
// Import plugin for Runtypes
import * as tPlugin from "../../api/data-server/zod";

// Import plugin for Zod and JSON Schema generation
import * as jsonSchema from "../../api/md-jsonschema/zod";

import * as api from "./api";

// Function to create REST API specification, utilizing generic REST API things in ./api and our functionality in ./lib.
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
      .withMetadataProvider(
        "openapi",
        openapi.createOpenAPIProvider(
          jsonSchema.createJsonSchemaFunctionality({
            encoding: {
              contentTypes: [tPlugin.CONTENT_TYPE],
              override: (decoder) =>
                isZodInstanceOf(decoder, theDate)
                  ? {
                      type: "string",
                      description: "Timestamp in ISO format",
                    }
                  : undefined,
            },
            decoding: {
              contentTypes: [tPlugin.CONTENT_TYPE],
              override: (decoder) =>
                isZodInstanceOf(decoder, theDate)
                  ? {
                      type: "string",
                      description: "Timestamp in ISO format",
                    }
                  : undefined,
            },
            transformSchema: openapi.convertToOpenAPISchemaObject,
          }),
        ),
      );

    // Add validation that some previous middleware has set the username to Koa state.
    // Instruct validation to return error code 403 if no username has been set (= no auth).
    const authenticated = notAuthenticated.refineContext(
      contextValidatorFactory(
        tPlugin.plainValidator(
          t
            .object({
              username: t.string(),
            })
            .describe("AuthenticatedState"),
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

    const idInBody = t.string().refine(
      (str) => idRegex.test(str), // TODO check that the match is same as whole string, since original string misses begin & end marks (as they would confuse URL regexp)
      "The IDs must be in valid UUID format.",
    );

    const endpointArgs = {
      idRegex,
      idInBody,
      data: {
        thing: t.object({ property: idInBody }),
      },
    };

    // Prefixes can be combined to any depth.
    // Note that it is technically possible and desireable to define prefixes in separate files, but for this sample, let's just define everything here.
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
          // Don't pass UUID regex to urlParameter, to make integration tests test also onInvalidUrlParameter event
          id: tPlugin.urlParameter(tPlugin.parameterString(idInBody)),
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

    const notAuthenticatedAPI = prefix.atPrefix("/api", things);
    const authenticatedAPI = prefix.atPrefix("/api", secret);
    const notAuthenticatedMetadata = notAuthenticated.getMetadataFinalResult(
      {
        openapi: {
          title: "Sample REST API (Unauthenticated)",
          version: "0.1",
        },
      },
      [notAuthenticatedAPI.getMetadata("")],
    ).openapi;
    const authenticatedMetadata = authenticated.getMetadataFinalResult(
      {
        openapi: {
          title: "Sample REST API (Authenticated)",
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
        tPlugin.outputValidator(
          t.unknown(),
          // Allow access from e.g. SwaggeR UI in browser
          {
            "Access-Control-Allow-Origin": "*",
          },
        ),
        // No metadata - as this is the metadata-returning endpoints itself
        {},
      )
      .createEndpoint({});

    // Allow Swagger UI execution
    const cors: ep.CORSOptions = {
      origin: "*",
      allowHeaders: "Content-Type",
    };

    return {
      api: [
        ep.withCORSOptions(notAuthenticatedAPI, cors),
        ep.withCORSOptions(authenticatedAPI, cors),
        // Docs endpoint doesn't need OPTIONS support.
        docs,
      ],
    };
  },
};

export default restModule;

// Avoid allocating new date on every call
const theDate = new Date();

const isZodInstanceOf = (zodType: t.ZodType, value: unknown) => {
  // In Zod, instanceof is .superRefine call, which returns ZodEffect
  const firstParty = zodType as t.ZodFirstPartySchemaTypes;
  const { _def } = firstParty;
  let retVal = false;
  if (
    _def.typeName === t.ZodFirstPartyTypeKind.ZodEffects &&
    _def.effect.type === "refinement"
  ) {
    let issuesSeen = false;
    _def.effect.refinement(value, {
      addIssue: () => (issuesSeen = true),
      path: [],
    });
    retVal = !issuesSeen;
  }
  return retVal;
};
