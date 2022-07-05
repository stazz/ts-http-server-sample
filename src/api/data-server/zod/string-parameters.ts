import * as t from "zod";
import * as data from "../../core/data";
import * as common from "../../data/zod";

export function parameterString(): data.StringParameterTransform<
  string,
  common.ValidationError
>;
export function parameterString<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDecoder extends t.ZodType<string>,
>(
  customString: TDecoder,
): data.StringParameterTransform<t.infer<TDecoder>, common.ValidationError>;
export function parameterString<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDecoder extends t.ZodType<string>,
>(
  customString?: TDecoder,
): data.StringParameterTransform<
  string | t.infer<TDecoder>,
  common.ValidationError
> {
  return common.plainValidator(customString ?? t.string());
}

const TRUE = "true" as const;
export const parameterBoolean = () =>
  data.transitiveDataValidation(
    common.plainValidator(t.union([t.literal(TRUE), t.literal("false")])),
    (str) => ({
      error: "none",
      data: str === TRUE,
    }),
  );

// export const parameterISOTimestamp = () =>
//   common.plainValidator(tt.DateFromISOString);
