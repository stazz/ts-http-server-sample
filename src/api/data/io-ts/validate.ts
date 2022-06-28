import type * as data from "../../core/data";
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
  ): data.DataValidator<TInput, TData, error.ValidationError> =>
  (input) =>
    utils.transformLibraryResultToModelResult(validation.decode(input));
