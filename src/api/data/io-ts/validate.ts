import * as t from "io-ts";
import * as data from "../../core/data-server";
import * as error from "./error";
import * as utils from "./utils";

export type Decoder<TData, TInput = unknown> = t.Decoder<TInput, TData>;
export type Encoder<TOutput, TSerialized> = t.Encoder<TOutput, TSerialized>;

export const plainValidator =
  <TInput, TData>(
    validation: Decoder<TData, TInput>,
  ): data.DataValidator<TInput, TData, error.ValidationError> =>
  (input) =>
    utils.transformLibraryResultToModelResult(validation.decode(input));

export const plainValidatorEncoder =
  <TOutput, TSerialized>(
    validation: Encoder<TOutput, TSerialized> & { is: t.Is<TOutput> },
  ): data.DataValidator<TOutput, TSerialized, error.ValidationError> =>
  (input) =>
    validation.is(input)
      ? utils.transformLibraryResultToModelResult({
          _tag: "Right",
          right: validation.encode(input),
        })
      : {
          error: "error",
          errorInfo: error.exceptionAsValidationError(
            input,
            new Error(
              "Given value for input was not what the validator needed.",
            ),
          ),
        };
