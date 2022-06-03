import * as data from "./data";
import * as methods from "./methods";

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

export interface MetadataBuilder<
  TArgument extends HKTArg,
  TEndpointArg,
  TEndpointMD,
> {
  getEndpointsMetadata: (
    arg: TEndpointArg,
    urlSpec: ReadonlyArray<
      | string
      | (Omit<
          data.URLDataParameterValidatorSpec<unknown, unknown>,
          "validator"
        > & { name: string })
    >,
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

interface OpenAPIArgumentsStatic {
  summary: string;
}

interface OpenAPIArgumentsURLData<TURLData> {
  urlParameters: { [P in keyof TURLData]: { description: string } };
}

interface OpenAPIArgumentsQuery<TQuery> {
  queryParameters: {
    [P in keyof TQuery]: { description: string };
  };
}

interface OpenAPIArgumentsInput<TBody> {
  body: { [P in keyof TBody]: { example: TBody[P] } };
}

interface OpenAPIArgumentsOutput<TOutput> {
  output: {
    description: string;
    info: {
      [P in keyof TOutput]: {
        example: TOutput[P];
      };
    };
  };
}

interface OpenAPIContextArgs {
  securitySchemes: Array<OpenAPISecurityScheme>;
}

interface OpenAPISecurityScheme {
  type: string;
}

interface OpenAPIOperation {
  summary: string;
}

interface OpenAPIPathItemArg {
  summary?: string;
  description?: string;
}

type OpenAPIPathItemMethods = Partial<
  Record<Lowercase<methods.HttpMethod>, OpenAPIOperation>
>;

interface OpenAPIPathItem extends OpenAPIPathItemArg, OpenAPIPathItemMethods {}

type OpenAPIPaths = Record<string, OpenAPIPathItem>;

export const openApiProvider: InitialMetadataProvider<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  OpenAPIPaths,
  OpenAPIContextArgs
> = new InitialMetadataProviderClass<
  OpenAPIArguments,
  OpenAPIPathItemArg,
  OpenAPIPaths,
  OpenAPIContextArgs
>(
  {
    securitySchemes: [],
  },
  (ctx) => ({
    getEndpointsMetadata: (pathItemBase, urlSpec, methods) => {
      const urlString = urlSpec.map((stringOrSpec) =>
        typeof stringOrSpec === "string"
          ? stringOrSpec
          : `{${stringOrSpec.name}}`,
      );
      const path: OpenAPIPathItem = { ...pathItemBase };
      for (const [method, specs] of Object.entries(methods)) {
        if (specs) {
          (path as OpenAPIPathItemMethods)[
            method.toLowerCase() as Lowercase<methods.HttpMethod>
          ] = {
            summary: specs.metadataArguments.summary,
          };
        }
        // eslint-disable-next-line no-console
        console.info(`TODO`, method, specs);
      }
      return (urlPrefix) => ({ [`${urlPrefix}${urlString}`]: path });
    },
  }),
);
