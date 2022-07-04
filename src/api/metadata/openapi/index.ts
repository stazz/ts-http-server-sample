import * as md from "../../core/metadata";

// The openapi-types is pretty good, but not perfect
// E.g. the ParameterObject's "in" property is just "string", instead of "'query' | 'header' | 'path' | 'cookie'", as mentioned in spec.
// Maybe define own OpenAPI types at some point, altho probably no need, as these types can be modified with things like Omit and Pick.
import type { OpenAPIV3_1 as openapi } from "openapi-types";

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

export type OpenAPIMetadataProvider = md.MetadataProvider<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  PathsObjectInfo,
  OpenAPIContextArgs,
  openapi.InfoObject,
  openapi.Document
>;

export type OpenAPIMetadataBuilder = md.MetadataBuilder<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  PathsObjectInfo
>;

// TODO - the argument would be callback to get JSON schema from data validator.
export const createOpenAPIProvider = (): OpenAPIMetadataProvider => {
  const initialContextArgs: OpenAPIContextArgs = {
    securitySchemes: [],
  };
  return new md.InitialMetadataProviderClass(
    initialContextArgs,
    ({ securitySchemes }) => ({
      getEndpointsMetadata: (pathItemBase, urlSpec, methods) => {
        const pathObject: openapi.PathItemObject = { ...pathItemBase };
        pathObject.parameters = urlSpec
          .filter((s): s is md.URLParameterSpec => typeof s !== "string")
          .map(({ name }) => ({
            name: name,
            in: "path",
            required: true,
          }));
        for (const [method, specs] of Object.entries(methods)) {
          if (specs) {
            const parameters: Array<openapi.ParameterObject> = [];
            (
              pathObject as {
                [method in openapi.HttpMethods]?: openapi.OperationObject;
              }
            )[method.toLowerCase() as Lowercase<openapi.HttpMethods>] = {
              ...specs.metadataArguments.operation,
              security: securitySchemes.map(({ name }) => ({ [name]: [] })),
            };
            parameters.push(
              ...Object.entries(
                specs.querySpec?.isParameterRequired ?? {},
              ).map<openapi.ParameterObject>(([qParamName, required]) => ({
                in: "query",
                name: qParamName,
                required,
              })),
            );
            if (parameters.length > 0) {
              pathObject.parameters = parameters;
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
      const doc: openapi.Document = {
        openapi: "3.0.3",
        info,
        components: {
          securitySchemes: Object.fromEntries(
            securitySchemes.map(({ name, scheme }) => [name, scheme]),
          ),
        },
        paths: Object.fromEntries(
          paths.map(({ urlPath, pathObject }) => [urlPath, pathObject]),
        ),
      };
      return doc;
    },
  );
};
