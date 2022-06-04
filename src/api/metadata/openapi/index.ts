import * as md from "../../core/metadata";

// The openapi-types is pretty good, but not perfect
// E.g. the ParameterObject's "in" property is just "string", instead of "'query' | 'header' | 'path' | 'cookie'", as mentioned in spec.
// Maybe define own OpenAPI types at some point, altho probably no need, as these types can be modified with things like Omit and Pick.
import type { OpenAPIV3_1 as openapi } from "openapi-types";

interface OpenAPIArguments extends md.HKTArg {
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
  urlParameters: { [P in keyof TURLData]: OpenAPIParameterInput };
}

interface OpenAPIArgumentsQuery<TQuery> {
  queryParameters: {
    [P in keyof TQuery]: OpenAPIParameterInput;
  };
}

interface OpenAPIArgumentsInput<TBody> {
  body: { [P in keyof TBody]: OpenAPIParameterMedia<TBody[P]> };
}

interface OpenAPIArgumentsOutput<TOutput> {
  output: Pick<openapi.ResponseObject, "description"> & {
    mediaTypes: {
      [P in keyof TOutput]: OpenAPIParameterMedia<TOutput[P]>;
    };
  };
}

interface OpenAPIContextArgs {
  securitySchemes: Array<openapi.SecuritySchemeObject>;
}

type OpenAPIPathItemArg = Omit<
  openapi.PathItemObject,
  openapi.HttpMethods | "$ref" | "parameters"
>;

export interface PathsObjectInfo {
  urlDescription: string;
  path: openapi.PathItemObject;
}

export const openApiProvider: md.MetadataProvider<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  PathsObjectInfo,
  OpenAPIContextArgs,
  openapi.InfoObject,
  openapi.Document
> = new md.InitialMetadataProviderClass<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  PathsObjectInfo,
  OpenAPIContextArgs,
  openapi.InfoObject,
  openapi.Document
>(
  {
    securitySchemes: [],
  },
  ({ securitySchemes }) => ({
    getEndpointsMetadata: (pathItemBase, urlSpec, methods) => {
      const path: openapi.PathItemObject = { ...pathItemBase };
      path.parameters = urlSpec
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
            path as {
              [method in openapi.HttpMethods]?: openapi.OperationObject;
            }
          )[method.toLowerCase() as Lowercase<openapi.HttpMethods>] = {
            ...specs.metadataArguments.operation,
          };
          parameters.push(
            ...(specs.querySpec?.queryParameterNames.map((qParamName) => ({
              in: "query",
              name: qParamName,
              // TODO required
            })) ?? []),
          );
          if (parameters.length > 0) {
            path.parameters = parameters;
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
        urlDescription: `${urlPrefix}${urlString}`,
        path,
      });
    },
  }),
  (ctx, info, paths) => {
    return {
      openapi: "3.0.3",
      info,
      components: [],
      paths: Object.fromEntries(
        paths.map(({ urlDescription, path }) => [urlDescription, path]),
      ),
    };
  },
);
