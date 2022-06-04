import * as core from "../core";

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

export interface MetadataProvider<
  TArgument extends HKTArg,
  TEndpointArg,
  TEndpointMD,
  TContextArguments,
  TFinalMetadataArgs,
  TFinalMetadata,
> extends InitialMetadataProvider<
    TArgument,
    TEndpointArg,
    TEndpointMD,
    TContextArguments
  > {
  createFinalMetadata(
    args: TFinalMetadataArgs,
    endpointsMetadatas: ReadonlyArray<TEndpointMD>,
  ): TFinalMetadata;
}

export class InitialMetadataProviderClass<
  TArgument extends HKTArg,
  TEndpointArg,
  TEndpointMD,
  TContextArguments,
  TFinalMetadataArgs,
  TFinalMetadata,
> implements
    MetadataProvider<
      TArgument,
      TEndpointArg,
      TEndpointMD,
      TContextArguments,
      TFinalMetadataArgs,
      TFinalMetadata
    >
{
  public constructor(
    private readonly _contextInfo: TContextArguments,
    private readonly _getBuilder: (
      contextInfo: TContextArguments,
    ) => MetadataBuilder<TArgument, TEndpointArg, TEndpointMD>,
    private readonly _getFinalMD: (
      contextInfo: TContextArguments,
      args: TFinalMetadataArgs,
      endpointMetadatas: ReadonlyArray<TEndpointMD>,
    ) => TFinalMetadata,
  ) {}

  public withRefinedContext(
    contextArgs: TContextArguments,
  ): InitialMetadataProvider<
    TArgument,
    TEndpointArg,
    TEndpointMD,
    TContextArguments
  > {
    return new InitialMetadataProviderClass(
      contextArgs,
      this._getBuilder,
      this._getFinalMD,
    );
  }

  public getBuilder(): MetadataBuilder<TArgument, TEndpointArg, TEndpointMD> {
    return this._getBuilder(this._contextInfo);
  }

  public createFinalMetadata(
    args: TFinalMetadataArgs,
    endpointMetadatas: ReadonlyArray<TEndpointMD>,
  ): TFinalMetadata {
    return this._getFinalMD(this._contextInfo, args, endpointMetadatas);
  }
}

export type URLParameterSpec = Omit<
  core.URLDataParameterValidatorSpec<unknown, unknown>,
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
                core.QueryValidatorSpec<unknown, unknown, string>,
                "validator"
              >
            | undefined;
          inputSpec:
            | Omit<
                core.DataValidatorRequestInputSpec<
                  unknown,
                  unknown,
                  Record<string, unknown>
                >,
                "validator"
              >
            | undefined;
          outputSpec: Omit<
            core.DataValidatorResponseOutputSpec<
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
