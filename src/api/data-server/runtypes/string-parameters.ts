import * as t from "runtypes";
import * as data from "../../core/data";
import * as common from "../../data/runtypes";

export function parameterString(): data.StringParameterTransform<
  string,
  common.ValidationError
>;
export function parameterString<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDecoder extends t.Runtype<string>,
>(
  customString: TDecoder,
): data.StringParameterTransform<t.Static<TDecoder>, common.ValidationError>;
export function parameterString<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDecoder extends t.Runtype<string>,
>(
  customString?: TDecoder,
): data.StringParameterTransform<
  string | t.Static<TDecoder>,
  common.ValidationError
> {
  return common.plainValidator(customString ?? t.String);
}

const TRUE = "true" as const;
export const parameterBoolean = () =>
  data.transitiveDataValidation(
    common.plainValidator(t.Union(t.Literal(TRUE), t.Literal("false"))),
    (str) => ({
      error: "none",
      data: str === TRUE,
    }),
  );

// export const parameterISOTimestamp = () =>
//   common.plainValidator(tt.DateFromISOString);
