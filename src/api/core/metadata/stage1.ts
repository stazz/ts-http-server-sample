import type * as data from "../data-server";
import type * as common from "./common";

export interface MetadataBuilder<
  TArgument extends common.HKTArg,
  TEndpointArg,
  TEndpointMD,
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
> {
  getEndpointsMetadata: (
    arg: TEndpointArg,
    urlSpec: ReadonlyArray<string | URLParameterSpec>,
    methods: Partial<
      Record<
        string,
        {
          querySpec:
            | Omit<data.QueryValidatorSpec<unknown, string>, "validator">
            | undefined;
          inputSpec:
            | Omit<
                data.DataValidatorRequestInputSpec<unknown, TInputContents>,
                "validator"
              >
            | undefined;
          outputSpec: Omit<
            data.DataValidatorResponseOutputSpec<unknown, TOutputContents>,
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
  data.URLDataParameterValidatorSpec<unknown>,
  "validator"
> & { name: string };
