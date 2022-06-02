import * as data from "./data";
import * as methods from "./methods";
import * as md from "./metadata";

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
  TArguments extends HKTArg,
  TContextArguments,
> {
  withRefinedContext(
    contextArgs: TContextArguments,
  ): InitialMetadataProvider<TArguments, TContextArguments>;

  getBuilder(): InitialMetadataBuilder<TArguments>;
}

export class InitialMetadataProviderClass<
  TArguments extends HKTArg,
  TContextArguments,
> implements InitialMetadataProvider<TArguments, TContextArguments>
{
  public constructor(
    private readonly _contextInfo: TContextArguments,
    private readonly _getBuilder: (
      contextInfo: TContextArguments,
    ) => InitialMetadataBuilder<TArguments>,
  ) {}

  public withRefinedContext(
    contextArgs: TContextArguments,
  ): InitialMetadataProvider<TArguments, TContextArguments> {
    return new InitialMetadataProviderClass(contextArgs, this._getBuilder);
  }

  public getBuilder(): InitialMetadataBuilder<TArguments> {
    return this._getBuilder(this._contextInfo);
  }
}

export interface InitialMetadataBuilder<TArguments extends HKTArg>
  extends MetadataProviderForMethodsBase<TArguments, undefined> {
  withURLParameters: <
    TURLParameters extends Record<
      string,
      data.URLDataParameterValidatorSpec<unknown, unknown>
    >,
  >(
    parameters: TURLParameters,
  ) => MetadataProviderWithURLData<TArguments, TURLParameters>;
}

export interface MetadataProviderForMethodsBase<
  TArguments extends HKTArg,
  TURLData,
> {
  withMethod(
    method: methods.HttpMethodWithoutBody,
  ): MetadataProviderWithQuery<TArguments, TURLData, undefined>;
  withMethod<TQuery extends data.QueryValidatorSpec<unknown, unknown, string>>(
    method: methods.HttpMethodWithoutBody,
    querySpec: TQuery | undefined,
  ): MetadataProviderWithQuery<
    TArguments,
    TURLData,
    { [P in TQuery["queryParameterNames"][number]]: unknown }
  >;
  withMethod(
    method: methods.HttpMethodWithBody,
  ): MetadataProviderWithQueryAndBody<TArguments, TURLData, undefined>;
  withMethod<TQuery extends data.QueryValidatorSpec<unknown, unknown, string>>(
    method: methods.HttpMethodWithBody,
    querySpec: TQuery | undefined,
  ): MetadataProviderWithQueryAndBody<
    TArguments,
    TURLData,
    { [P in TQuery["queryParameterNames"][number]]: unknown }
  >;
}

export type MetadataProviderWithURLData<
  TArguments extends HKTArg,
  TURLData,
> = MetadataProviderForMethodsBase<TArguments, TURLData>;

export interface MetadataProviderWithQuery<
  TArguments extends HKTArg,
  TURLData,
  TQuery,
> {
  withOutput: <
    TOutput extends data.DataValidatorResponseOutputSpec<
      unknown,
      unknown,
      Record<string, unknown>
    >,
  >(
    outputSpec: TOutput,
    metadataArguments: Kind<
      TArguments,
      TURLData,
      TQuery,
      undefined,
      { [P in keyof TOutput["validatorSpec"]]: unknown }
    >,
  ) => // TODO we need to return something else - we can't have one AppEndpointMetadata per metadata type.
  // I think we should parametrize that like HKTArg
  md.AppEndpointMetadata<undefined, TOutput["validatorSpec"], unknown>;
}

export interface MetadataProviderWithQueryAndBody<
  TArguments extends HKTArg,
  TURLData,
  TQuery,
> extends MetadataProviderWithQuery<TArguments, TURLData, TQuery> {
  withInputAndOutput: <
    TInput extends data.DataValidatorRequestInputSpec<
      unknown,
      unknown,
      Record<string, unknown>
    >,
    TOutput extends data.DataValidatorResponseOutputSpec<
      unknown,
      unknown,
      Record<string, unknown>
    >,
  >(
    inputSpec: TInput,
    outputSpec: TOutput,
    metadataArguments: Kind<
      TArguments,
      TURLData,
      TQuery,
      undefined,
      { [P in keyof TOutput["validatorSpec"]]: unknown }
    >,
  ) => void;
}

interface OpenAPIArguments extends HKTArg {
  readonly type: OpenAPIArgumentsURLData<this["_TURLData"]> &
    OpenAPIArgumentsQuery<this["_TQuery"]> &
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

interface OpenAPIArgumentsOutput<TOutput> {
  outputDescription: string;
  outputInfo: {
    [P in keyof TOutput]: {
      encoding: string;
    };
  };
}

interface OpenAPIContextArgs {
  securitySchemes: Array<OpenAPISecurityScheme>;
}

interface OpenAPISecurityScheme {
  type: string;
}
export const openApiProvider: InitialMetadataProvider<
  OpenAPIArguments,
  OpenAPIContextArgs
> = new InitialMetadataProviderClass<OpenAPIArguments, OpenAPIContextArgs>(
  {
    securitySchemes: [],
  },
  (ctx) => null!,
);

const test = openApiProvider
  .getBuilder()
  .withURLParameters({
    urlParam: {
      regExp: /moi/,
      validator: null!,
    },
  })
  .withMethod("GET", {
    validator: null!,
    queryParameterNames: ["queryParam"] as const,
  })
  .withOutput(
    {
      validator: null!,
      validatorSpec: { "application/json": null },
    },
    {
      urlParameters: {
        urlParam: {
          description: "moi",
        },
      },
      queryParameters: {
        queryParam: {
          description: "moi",
        },
      },
      outputDescription: "moi",
      outputInfo: {
        "application/json": {
          encoding: "moi",
        },
      },
    },
  );
