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
  TEndpointMD,
  TContextArguments,
> {
  withRefinedContext(
    contextArgs: TContextArguments,
  ): InitialMetadataProvider<TArgument, TEndpointMD, TContextArguments>;

  getBuilder(): MetadataBuilder<TArgument, TEndpointMD>;
}

export class InitialMetadataProviderClass<
  TArgument extends HKTArg,
  TEndpointMD,
  TContextArguments,
> implements InitialMetadataProvider<TArgument, TEndpointMD, TContextArguments>
{
  public constructor(
    private readonly _contextInfo: TContextArguments,
    private readonly _getBuilder: (
      contextInfo: TContextArguments,
    ) => MetadataBuilder<TArgument, TEndpointMD>,
  ) {}

  public withRefinedContext(
    contextArgs: TContextArguments,
  ): InitialMetadataProvider<TArgument, TEndpointMD, TContextArguments> {
    return new InitialMetadataProviderClass(contextArgs, this._getBuilder);
  }

  public getBuilder(): MetadataBuilder<TArgument, TEndpointMD> {
    return this._getBuilder(this._contextInfo);
  }
}

export interface MetadataBuilder<TArgument extends HKTArg, TEndpointMD> {
  getEndpointsMetadata: (
    urlSpec: ReadonlyArray<
      | string
      | Omit<data.URLDataParameterValidatorSpec<unknown, unknown>, "validator">
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
  readonly type: OpenAPIArgumentsURLData<this["_TURLData"]> &
    OpenAPIArgumentsQuery<this["_TQuery"]> &
    OpenAPIArgumentsInput<this["_TBody"]> &
    OpenAPIArgumentsOutput<this["_TOutput"]>;
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

interface OpenAPIPathItem
  extends Partial<Record<Lowercase<methods.HttpMethod>, OpenAPIOperation>> {
  summary: string;
}

type OpenAPIPaths = Record<string, OpenAPIPathItem>;

export const openApiProvider: InitialMetadataProvider<
  OpenAPIArguments,
  OpenAPIPaths,
  OpenAPIContextArgs
> = new InitialMetadataProviderClass<
  OpenAPIArguments,
  OpenAPIPaths,
  OpenAPIContextArgs
>(
  {
    securitySchemes: [],
  },
  (ctx) => ({
    getEndpointsMetadata: (urlSpec, methods) => {
      const path: OpenAPIPathItem = {
        summary: "Wat",
      };
      for (const [method, specs] of Object.entries(methods)) {
        // eslint-disable-next-line no-console
        console.info(`TODO ${method} ${specs}`);
      }
      return (urlPrefix) => ({});
    },
  }),
);
