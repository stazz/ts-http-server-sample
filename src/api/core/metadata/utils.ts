import * as common from "./common";
import * as stage0 from "./stage0";
import * as stage1 from "./stage1";

export class InitialMetadataProviderClass<
  TArgument extends common.HKTArg,
  TEndpointArg,
  TEndpointMD,
  TContextArguments,
  TFinalMetadataArgs,
  TFinalMetadata,
> implements
    stage0.MetadataProvider<
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
    ) => stage1.MetadataBuilder<TArgument, TEndpointArg, TEndpointMD>,
    private readonly _getFinalMD: (
      contextInfo: TContextArguments,
      args: TFinalMetadataArgs,
      endpointMetadatas: ReadonlyArray<TEndpointMD>,
    ) => TFinalMetadata,
  ) {}

  public withRefinedContext(
    contextArgs: TContextArguments,
  ): stage0.MetadataProvider<
    TArgument,
    TEndpointArg,
    TEndpointMD,
    TContextArguments,
    TFinalMetadataArgs,
    TFinalMetadata
  > {
    return new InitialMetadataProviderClass(
      contextArgs,
      this._getBuilder,
      this._getFinalMD,
    );
  }

  public getBuilder(): stage1.MetadataBuilder<
    TArgument,
    TEndpointArg,
    TEndpointMD
  > {
    return this._getBuilder(this._contextInfo);
  }

  public createFinalMetadata(
    args: TFinalMetadataArgs,
    endpointMetadatas: ReadonlyArray<TEndpointMD>,
  ): TFinalMetadata {
    return this._getFinalMD(this._contextInfo, args, endpointMetadatas);
  }
}
