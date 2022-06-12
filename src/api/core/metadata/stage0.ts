import * as common from "./common";
import * as stage1 from "./stage1";

export interface MetadataProvider<
  TArgument extends common.HKTArg,
  TEndpointArg,
  TEndpointMD,
  TContextArguments,
  TFinalMetadataArgs,
  TFinalMetadata,
> {
  withRefinedContext(
    contextArgs: TContextArguments,
  ): MetadataProvider<
    TArgument,
    TEndpointArg,
    TEndpointMD,
    TContextArguments,
    TFinalMetadataArgs,
    TFinalMetadata
  >;

  getBuilder(): stage1.MetadataBuilder<TArgument, TEndpointArg, TEndpointMD>;
  createFinalMetadata(
    args: TFinalMetadataArgs,
    endpointsMetadatas: ReadonlyArray<TEndpointMD>,
  ): TFinalMetadata;
}
