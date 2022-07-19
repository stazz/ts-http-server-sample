import * as data from "../../core/data-server";
import * as t from "runtypes";
import * as utils from "./utils";

export type Decoder<TData> = t.Runtype<TData>;
export type Encoder<TOutput, TSerialized> = {
  validation: Decoder<TOutput>;
  transform: (output: TOutput) => TSerialized;
};

export const plainValidator =
  <TData>(validation: Decoder<TData>): data.DataValidator<unknown, TData> =>
  (input) =>
    utils.transformLibraryResultToModelResult(validation.validate(input));

export function encoder<TOutput>(
  validation: Decoder<TOutput>,
): Encoder<TOutput, TOutput>;
export function encoder<TOutput, TSerialized>(
  validation: Decoder<TOutput>,
  transform: Encoder<TOutput, TSerialized>["transform"],
): Encoder<TOutput, TSerialized>;
export function encoder<TOutput, TSerialized>(
  validation: Decoder<TOutput>,
  transform?: Encoder<TOutput, TSerialized>["transform"],
): Encoder<TOutput, TSerialized> {
  return {
    validation,
    transform:
      transform ??
      (((output: TOutput) => output) as unknown as Encoder<
        TOutput,
        TSerialized
      >["transform"]),
  };
}
