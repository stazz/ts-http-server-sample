import type * as common from "../data";
import type * as stream from "stream";

export interface DataValidatorResponseOutputSpec<
  TOutput,
  TContents extends TOutputContentsBase,
> {
  validator: DataValidatorResponseOutput<TOutput>;
  validatorSpec: DataValidatorResponseOutputValidatorSpec<TContents>;
}

export type DataValidatorResponseOutput<TOutput> = common.DataValidator<
  TOutput,
  DataValidatorResponseOutputSuccess
>;

export type DataValidatorResponseOutputSuccess = {
  contentType: string;
  output: string | Buffer | stream.Readable;
  // TODO Do we want headers to be returned by output handler?
  // That kinda makes sense, since if we split that ->
  //   the user might need to do some tricks, if output headers depend on output value, which might not end up actual response body!
  headers?: Record<string, string>; // TODO expose common Headers type in ../data module
};

export interface DataValidatorResponseOutputValidatorSpec<
  TContents extends TOutputContentsBase,
> {
  // TODO make dynamic header building possible
  // TODO we actually don't want headerSpec to be bound to outputs.
  // Instead, we should have inputHeaders and outputHeaders properties in builder.
  headerSpec: Record<string, string>;
  // TODO undefinedAccepted: 'maybe' | 'only' | 'never'
  contents: TContents;
}

export type TOutputContentsBase = Record<string, unknown>;
