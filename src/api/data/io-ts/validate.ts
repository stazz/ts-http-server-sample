import * as core from "../../core/core";
import * as t from "io-ts";
import type * as error from "./error";
import * as utils from "./utils";

export type Decoder<TData, TInput = unknown> = t.Decoder<TInput, TData> & {
  _tag: string;
};
export type Encoder<TOutput, TSerialized> = t.Encoder<TOutput, TSerialized> & {
  _tag: string;
};

export const plainValidator =
  <TInput, TData>(
    validation: Decoder<TData, TInput>,
  ): core.DataValidator<TInput, TData, error.ValidationError> =>
  (input) =>
    utils.transformIoTsResultToModelResult(validation.decode(input));
