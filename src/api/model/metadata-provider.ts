import * as data from "./data";
// The openapi-types is pretty good, but not perfect
// E.g. the ParameterObject's "in" property is just "string", instead of "'query' | 'header' | 'path' | 'cookie'", as mentioned in spec.
// Maybe define own OpenAPI types at some point, altho probably no need, as these types can be modified with things like Omit and Pick.
import type { OpenAPIV3_1 as openapi } from "openapi-types";

// Higher-kinded-type trick from: https://www.matechs.com/blog/encoding-hkts-in-typescript-once-again
export interface HKTArg {
  readonly _TURLData?: unknown;
  readonly _TMethod?: unknown;
  readonly _TQuery?: unknown;
  readonly _TBody?: unknown;
  readonly _TOutput?: unknown;

  readonly type?: unknown;
}

export type Kind<
  F extends HKTArg,
  TURLData,
  TQuery,
  TBody,
  TOutput,
> = F extends {
  readonly type: unknown;
}
  ? (F & {
      readonly _TURLData: TURLData;
      _TQuery: TQuery;
      _TBody: TBody;
      _TOutput: TOutput;
    })["type"]
  : {
      readonly _F: F;
      readonly _TURLData: () => TURLData;
      readonly TQuery: () => TQuery;
      readonly TBody: () => TBody;
      readonly TOutput: () => TOutput;
    };

export interface InitialMetadataProvider<
  TArgument extends HKTArg,
  TEndpointArg,
  TEndpointMD,
  TContextArguments,
> {
  withRefinedContext(
    contextArgs: TContextArguments,
  ): InitialMetadataProvider<
    TArgument,
    TEndpointArg,
    TEndpointMD,
    TContextArguments
  >;

  getBuilder(): MetadataBuilder<TArgument, TEndpointArg, TEndpointMD>;
}

export class InitialMetadataProviderClass<
  TArgument extends HKTArg,
  TEndpointArg,
  TEndpointMD,
  TContextArguments,
> implements
    InitialMetadataProvider<
      TArgument,
      TEndpointArg,
      TEndpointMD,
      TContextArguments
    >
{
  public constructor(
    private readonly _contextInfo: TContextArguments,
    private readonly _getBuilder: (
      contextInfo: TContextArguments,
    ) => MetadataBuilder<TArgument, TEndpointArg, TEndpointMD>,
  ) {}

  public withRefinedContext(
    contextArgs: TContextArguments,
  ): InitialMetadataProvider<
    TArgument,
    TEndpointArg,
    TEndpointMD,
    TContextArguments
  > {
    return new InitialMetadataProviderClass(contextArgs, this._getBuilder);
  }

  public getBuilder(): MetadataBuilder<TArgument, TEndpointArg, TEndpointMD> {
    return this._getBuilder(this._contextInfo);
  }
}

export type URLParameterSpec = Omit<
  data.URLDataParameterValidatorSpec<unknown, unknown>,
  "validator"
> & { name: string };

export interface MetadataBuilder<
  TArgument extends HKTArg,
  TEndpointArg,
  TEndpointMD,
> {
  getEndpointsMetadata: (
    arg: TEndpointArg,
    urlSpec: ReadonlyArray<string | URLParameterSpec>,
    methods: Partial<
      Record<
        string,
        {
          querySpec:
            | Omit<
                data.QueryValidatorSpec<unknown, unknown, string>,
                "validator"
              >
            | undefined;
          inputSpec:
            | Omit<
                data.DataValidatorRequestInputSpec<
                  unknown,
                  unknown,
                  Record<string, unknown>
                >,
                "validator"
              >
            | undefined;
          outputSpec: Omit<
            data.DataValidatorResponseOutputSpec<
              unknown,
              unknown,
              Record<string, unknown>
            >,
            "validator"
          >;
          metadataArguments: Kind<
            TArgument,
            Record<string, unknown>,
            Record<string, unknown>,
            Record<string, unknown>,
            Record<string, unknown>
          >;
        }
      >
    >,
  ) => SingleEndpointResult<TEndpointMD>;
}

export type SingleEndpointResult<TEndpointMD> = (
  urlPrefix: string,
) => TEndpointMD;

interface OpenAPIArguments extends HKTArg {
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
  example: T;
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
  output: {
    description: string;
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

export const openApiProvider: InitialMetadataProvider<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  openapi.PathsObject,
  OpenAPIContextArgs
> = new InitialMetadataProviderClass<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  openapi.PathsObject,
  OpenAPIContextArgs
>(
  {
    securitySchemes: [],
  },
  ({ securitySchemes }) => ({
    getEndpointsMetadata: (pathItemBase, urlSpec, methods) => {
      const urlString = urlSpec.map((stringOrSpec) =>
        typeof stringOrSpec === "string"
          ? stringOrSpec
          : `{${stringOrSpec.name}}`,
      );
      const path: openapi.PathItemObject = { ...pathItemBase };
      path.parameters = urlSpec
        .filter((s): s is URLParameterSpec => typeof s !== "string")
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
        // eslint-disable-next-line no-console
        console.info(`TODO`, method, specs);
      }
      return (urlPrefix) => ({ [`${urlPrefix}${urlString}`]: path });
    },
  }),
);
