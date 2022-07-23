import type * as common from "../data";
import type * as stream from "stream";

export interface DataValidatorResponseOutputSpec<
  TOutput,
  TContents extends TOutputContentsBase,
> {
  validator: DataValidatorResponseOutput<TOutput>;
  validatorSpec: DataValidatorResponseOutputValidatorSpec<TContents>; // spec: 1. possibleHeaders 2. output encoder
}

export type DataValidatorResponseOutput<TOutput> = common.DataValidator<
  TOutput,
  DataValidatorResponseOutputSuccess
>;

export type DataValidatorResponseOutputSuccess = {
  contentType: string;
  output: string | Buffer | stream.Readable;
  headers?: Record<string, string>; // TODO expose common Headers type in ../data module
};

export interface DataValidatorResponseOutputValidatorSpec<
  TContents extends TOutputContentsBase,
> {
  // TODO make dynamic header building possible
  headerSpec: Record<string, string>;
  contents: TContents;
}

export type TOutputContentsBase = Record<string, unknown>;
