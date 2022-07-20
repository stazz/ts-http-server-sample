import type * as common from "../data";
import type * as stream from "stream";

export interface DataValidatorResponseOutputSpec<
  TOutput,
  TValidatorSpec extends Record<string, unknown>,
> {
  validator: DataValidatorResponseOutput<TOutput>;
  validatorSpec: TValidatorSpec;
}

export type DataValidatorResponseOutput<TOutput> = common.DataValidator<
  TOutput,
  DataValidatorResponseOutputSuccess
>;

export type DataValidatorResponseOutputSuccess = {
  contentType: string;
  output: string | Buffer | stream.Readable;
};
