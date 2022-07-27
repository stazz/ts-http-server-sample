import * as md from "../../core/metadata";
import type * as data from "../../core/data-server";
import type * as jsonSchema from "json-schema";
import type * as jsonSchemaPlugin from "../../md-jsonschema/common";

// The openapi-types is pretty good, but not perfect
// E.g. the ParameterObject's "in" property is just "string", instead of "'query' | 'header' | 'path' | 'cookie'", as mentioned in spec.
// Maybe define own OpenAPI types at some point, altho probably no need, as these types can be modified with things like Omit and Pick.
import {
  // OpenAPIV3_1 is a bit uncompleted still, and many types are unusuable because the SchemaObject is changed, but not all the places are updated in type definitions where they should be.
  // Example:
  // the V3.1 ParameterObject is specified to be exactly same as V3.0 ParameterObject
  // However, the 'schema' property of ParameterObject is reference to SchemaObject, which is different between V3.0 and V3.1
  // Therefore, the V3.1 should also modify type of 'schema' property of ParameterObject, but it does not.
  OpenAPIV3 as openapi,
} from "openapi-types";

export interface OpenAPIArguments extends md.HKTArg {
  readonly type: OpenAPIArgumentsStatic &
    OpenAPIArgumentsURLData<this["_TURLData"]> &
    OpenAPIArgumentsQuery<this["_TQuery"]> &
    OpenAPIArgumentsInput<this["_TBody"]> &
    OpenAPIArgumentsOutput<this["_TOutput"]>;
}

type OpenAPIArgumentsStatic = {
  operation: Omit<
    openapi.OperationObject,
    "parameters" | "requestBody" | "responses" | "security"
  >;
};

type OpenAPIParameterInput = Pick<
  openapi.ParameterObject,
  "description" | "deprecated"
>;

interface OpenAPIParameterMedia<T> {
  example?: T;
}

interface OpenAPIArgumentsURLData<TURLData> {
  urlParameters: { [P in keyof TURLData]-?: OpenAPIParameterInput };
}

interface OpenAPIArgumentsQuery<TQuery> {
  queryParameters: {
    [P in keyof TQuery]-?: OpenAPIParameterInput;
  };
}

interface OpenAPIArgumentsInput<TBody> {
  body: { [P in keyof TBody]-?: OpenAPIParameterMedia<TBody[P]> };
}

interface OpenAPIArgumentsOutput<TOutput> {
  output: Pick<openapi.ResponseObject, "description"> & {
    mediaTypes: {
      [P in keyof TOutput]: OpenAPIParameterMedia<TOutput[P]>;
    };
  };
}

export interface OpenAPIContextArgs {
  securitySchemes: Array<{
    name: string;
    scheme: openapi.SecuritySchemeObject;
  }>;
}

export type OpenAPIPathItemArg = Omit<
  openapi.PathItemObject,
  openapi.HttpMethods | "$ref" | "parameters"
>;

export interface PathsObjectInfo {
  urlPath: string;
  pathObject: openapi.PathItemObject;
}

export type OpenAPIMetadataProvider<
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
> = md.MetadataProvider<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  PathsObjectInfo,
  OpenAPIContextArgs,
  TOutputContents,
  TInputContents,
  openapi.InfoObject,
  openapi.Document
>;

export type OpenAPIMetadataBuilder<
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
> = md.MetadataBuilder<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  PathsObjectInfo,
  TOutputContents,
  TInputContents
>;

export const createOpenAPIProvider = <
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
>({
  encoders,
  decoders,
  getUndefinedPossibility,
}: jsonSchemaPlugin.SupportedJSONSchemaFunctionality<
  openapi.SchemaObject,
  {
    [P in keyof TOutputContents]: jsonSchemaPlugin.SchemaTransformation<
      TOutputContents[P]
    >;
  },
  {
    [P in keyof TInputContents]: jsonSchemaPlugin.SchemaTransformation<
      TInputContents[P]
    >;
  }
>): OpenAPIMetadataProvider<TOutputContents, TInputContents> => {
  const initialContextArgs: OpenAPIContextArgs = {
    securitySchemes: [],
  };

  const generateEncoderJSONSchema = (contentType: string, encoder: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    encoders[contentType as keyof TOutputContents](encoder as any);
  const generateDecoderJSONSchema = (contentType: string, encoder: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    decoders[contentType as keyof TInputContents](encoder as any);
  return new md.InitialMetadataProviderClass(
    initialContextArgs,
    ({ securitySchemes }) => ({
      getEndpointsMetadata: (pathItemBase, urlSpec, methods) => {
        const pathObject: openapi.PathItemObject = { ...pathItemBase };
        // URL path parameters as common parameters for all operations under this URL path
        pathObject.parameters = urlSpec
          .filter((s): s is md.URLParameterSpec => typeof s !== "string")
          .map(({ name, ...urlParamSpec }) => ({
            name: name,
            in: "path",
            required: true,
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  pattern: urlParamSpec.regExp.source,
                },
              },
            },
          }));
        for (const [method, specs] of Object.entries(methods)) {
          if (specs) {
            const { metadataArguments, querySpec, inputSpec, outputSpec } =
              specs;
            const parameters: Array<openapi.ParameterObject> = [];
            const operationObject: openapi.OperationObject = {
              ...metadataArguments.operation,
              responses: {
                // TODO use also 204 if response spec can be undefined
                "200": {
                  description: metadataArguments.output.description,
                  content: Object.fromEntries(
                    Object.entries(outputSpec.validatorSpec.contents).map(
                      ([contentType, contentOutput]) => [
                        contentType,
                        addSchema<openapi.MediaTypeObject>(
                          {
                            example:
                              metadataArguments.output.mediaTypes[contentType]
                                .example,
                          },
                          generateEncoderJSONSchema(contentType, contentOutput),
                        ),
                      ],
                    ),
                  ),
                },
              },
            };
            if (securitySchemes.length > 0) {
              operationObject.security = securitySchemes.map(({ name }) => ({
                [name]: [],
              }));
            }
            pathObject[method.toLowerCase() as Lowercase<openapi.HttpMethods>] =
              operationObject;
            // Query parameters
            parameters.push(
              ...Object.entries(
                querySpec?.isParameterRequired ?? {},
              ).map<openapi.ParameterObject>(([qParamName, required]) => ({
                in: "query",
                name: qParamName,
                required,
                // schema: getSchema(),
              })),
            );
            if (parameters.length > 0) {
              operationObject.parameters = parameters;
            }

            // Request body
            if (inputSpec) {
              operationObject.requestBody = {
                // TODO false if response spec can be undefined
                required: true,
                content: Object.fromEntries(
                  Object.entries(inputSpec.validatorSpec.contents).map(
                    ([contentType, contentInput]) => [
                      contentType,
                      addSchema<openapi.MediaTypeObject>(
                        {
                          example: metadataArguments.body[contentType].example,
                        },
                        generateDecoderJSONSchema(contentType, contentInput),
                      ),
                    ],
                  ),
                ),
              };
            }
          }
        }
        const urlString = urlSpec
          .map((stringOrSpec) =>
            typeof stringOrSpec === "string"
              ? stringOrSpec
              : `{${stringOrSpec.name}}`,
          )
          .join("");
        return (urlPrefix) => ({
          urlPath: `${urlPrefix}${urlString}`,
          pathObject,
        });
      },
    }),
    ({ securitySchemes }, info, paths) => {
      const components: openapi.ComponentsObject = {};
      // TODO aggressively cache all cacheable things to components
      if (securitySchemes.length > 0) {
        components.securitySchemes = Object.fromEntries(
          securitySchemes.map(({ name, scheme }) => [name, scheme]),
        );
      }
      const doc: openapi.Document = {
        openapi: "3.0.3",
        info,
        paths: Object.fromEntries(
          paths.map(({ urlPath, pathObject }) => [urlPath, pathObject]),
        ),
      };
      if (Object.keys(components).length > 0) {
        doc.components = components;
      }
      return doc;
    },
  );
};

export type OpenAPIJSONSchemaFunctionality<
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
> = {
  encoders: {
    [P in keyof TOutputContents]: (
      encoder: TOutputContents[P],
    ) => openapi.SchemaObject | undefined;
  };
  decoders: {
    [P in keyof TInputContents]: (
      decoder: TInputContents[P],
    ) => openapi.SchemaObject | undefined;
  };
};

const addSchema = <
  T extends { schema?: openapi.ReferenceObject | openapi.SchemaObject },
>(
  obj: T,
  schema: openapi.SchemaObject | undefined,
): T => {
  if (schema) {
    obj.schema = schema;
  }
  return obj;
};

export const convertToOpenAPISchemaObject = (
  schema: jsonSchema.JSONSchema7Definition,
): openapi.SchemaObject =>
  // TODO actually validate this (e.g. type must not be array, etc)
  // At least convert the booleans to objects, as OpenAPI does not seem to like those
  convertBooleanSchemasToObjects(schema) as unknown as openapi.SchemaObject;

const convertBooleanSchemasToObjects = (
  schema: jsonSchemaPlugin.JSONSchema,
): Exclude<jsonSchemaPlugin.JSONSchema, boolean> => {
  let retVal: Exclude<jsonSchemaPlugin.JSONSchema, boolean>;
  if (typeof schema === "boolean") {
    retVal = schema
      ? {}
      : {
          not: {},
        };
  } else {
    retVal = stripUndefineds({
      ...schema,
      items: handleSchemaOrArray(schema.items),
      additionalItems: handleSchemaOrArray(schema.additionalItems),
      properties: handleSchemaRecord(schema.properties),
      patternProperties: handleSchemaRecord(schema.patternProperties),
      additionalProperties: handleSchemaOrArray(schema.additionalItems),
      dependencies: handleSchemaRecord(schema.dependencies),
      propertyNames: handleSchemaOrArray(schema.propertyNames),
      if: handleSchemaOrArray(schema.if),
      then: handleSchemaOrArray(schema.then),
      else: handleSchemaOrArray(schema.else),
      allOf: handleSchemaOrArray(schema.allOf),
      anyOf: handleSchemaOrArray(schema.anyOf),
      oneOf: handleSchemaOrArray(schema.oneOf),
      not: handleSchemaOrArray(schema.not),
      definitions: handleSchemaRecord(schema.definitions),
    });
  }
  return retVal;
};

const handleSchemaOrArray = <
  T extends jsonSchemaPlugin.JSONSchema | Array<jsonSchemaPlugin.JSONSchema>,
>(
  value: T | undefined,
): T | undefined =>
  value === undefined
    ? undefined
    : ((Array.isArray(value)
        ? value.map(convertBooleanSchemasToObjects)
        : convertBooleanSchemasToObjects(value)) as T);
const handleSchemaRecord = <
  TValue extends jsonSchemaPlugin.JSONSchema | undefined | string[],
>(
  record: Record<string, TValue> | undefined,
): Record<string, TValue> | undefined => {
  if (record !== undefined) {
    for (const [key, val] of Object.entries(record)) {
      if (val !== undefined && !Array.isArray(val)) {
        record[key] = convertBooleanSchemasToObjects(
          val,
        ) as typeof record[string];
      }
    }
  }
  return record;
};

const stripUndefineds = <T extends Record<string, unknown>>(val: T): T => {
  for (const key of Object.keys(val)) {
    if (val[key] === undefined) {
      delete val[key];
    }
  }
  return val;
};
