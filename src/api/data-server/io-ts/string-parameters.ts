import * as t from "io-ts";
import * as tt from "io-ts-types";
import * as data from "../../core/data";
import * as common from "../../data/io-ts";

export function parameterString(): data.StringParameterTransform<string>;
export function parameterString<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDecoder extends t.Type<any, string>,
>(customString: TDecoder): data.StringParameterTransform<t.TypeOf<TDecoder>>;
export function parameterString<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDecoder extends t.Type<any, string>,
>(
  customString?: TDecoder,
): data.StringParameterTransform<string | t.TypeOf<TDecoder>> {
  return common.plainValidator(customString ?? t.string);
}

const TRUE = "true" as const;
export const parameterBoolean = (): data.StringParameterTransform<boolean> =>
  data.transitiveDataValidation(
    common.plainValidator(t.keyof({ [TRUE]: "", false: "" })),
    (str) => ({
      error: "none",
      data: str === TRUE,
    }),
  );

export const parameterISOTimestamp = (): data.StringParameterTransform<Date> =>
  common.plainValidator(tt.DateFromISOString);
