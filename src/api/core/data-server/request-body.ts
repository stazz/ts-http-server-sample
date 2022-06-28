import type * as common from "../data";
import type * as stream from "stream";

export interface DataValidatorRequestInputSpec<
  TData,
  TError,
  TValidatorSpec extends Record<string, unknown>,
> {
  validator: DataValidatorRequestInput<TData, TError>;
  validatorSpec: TValidatorSpec;
}

export type DataValidatorRequestInput<TData, TError> = common.DataValidator<
  {
    contentType: string;
    input: stream.Readable;
  },
  TData,
  TError,
  Promise<
    | common.DataValidatorResult<TData, TError>
    | {
        error: "unsupported-content-type";
        supportedContentTypes: ReadonlyArray<string>;
      }
  >
>;
