import * as core from "../core";
import * as common from "./common";

export interface MetadataBuilder<
  TArgument extends common.HKTArg,
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
            | Omit<core.QueryValidatorSpec<unknown, unknown>, "validator">
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
          metadataArguments: common.Kind<
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

export type URLParameterSpec = Omit<
  core.URLDataParameterValidatorSpec<unknown, unknown>,
  "validator"
> & { name: string };
