import * as t from "io-ts";
import * as data from "../../core/data-server";
import * as utils from "./utils";

export type Decoder<TData, TInput = unknown> = t.Decoder<TInput, TData> & {
  _tag?: string;
};
export type Encoder<TOutput, TSerialized> = t.Encoder<TOutput, TSerialized> & {
  _tag?: string;
};

export const plainValidator =
  <TInput, TData>(
    validation: Decoder<TData, TInput>,
  ): data.DataValidator<TInput, TData> =>
  (input) =>
    utils.transformLibraryResultToModelResult(validation.decode(input));

export const plainValidatorEncoder =
  <TOutput, TSerialized>(
    validation: Encoder<TOutput, TSerialized> & { is: t.Is<TOutput> },
  ): data.DataValidator<TOutput, TSerialized> =>
  (input) =>
    utils.transformLibraryResultToModelResult(
      validation.is(input)
        ? {
            _tag: "Right",
            right: validation.encode(input),
          }
        : {
            _tag: "Left",
            left: [
              {
                value: input,
                message:
                  "Given value for input was not what the validator needed.",
                context: [],
              },
            ],
          },
    );
