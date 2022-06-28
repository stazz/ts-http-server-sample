import type * as common from "./common";
import type * as stream from "stream";

export interface DataValidatorResponseOutputSpec<
  TOutput,
  TError,
  TValidatorSpec extends Record<string, unknown>,
> {
  validator: DataValidatorResponseOutput<TOutput, TError>;
  validatorSpec: TValidatorSpec;
}

export type DataValidatorResponseOutput<TOutput, TError> = common.DataValidator<
  TOutput,
  DataValidatorResponseOutputSuccess,
  TError
>;

export type DataValidatorResponseOutputSuccess = {
  contentType: string;
  output: string | Buffer | stream.Readable;
};
