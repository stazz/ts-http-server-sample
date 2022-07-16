import * as data from "../data-server";
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
            | Omit<
                data.QueryValidatorSpec<unknown, string, unknown>,
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
  data.URLDataParameterValidatorSpec<unknown, unknown>,
  "validator"
> & { name: string };
