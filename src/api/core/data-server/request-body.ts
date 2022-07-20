import type * as common from "../data";
import type * as stream from "stream";

export interface DataValidatorRequestInputSpec<
  TData,
  TValidatorSpec extends Record<string, unknown>,
> {
  validator: DataValidatorRequestInput<TData>;
  validatorSpec: TValidatorSpec;
}

export type DataValidatorRequestInput<TData> = common.DataValidatorAsync<
  {
    contentType: string;
    input: stream.Readable;
  },
  TData,
  | common.DataValidatorResultError
  | {
      error: "unsupported-content-type";
      supportedContentTypes: ReadonlyArray<string>;
    }
>;
