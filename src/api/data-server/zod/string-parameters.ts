import * as t from "zod";
import * as data from "../../core/data";
import * as common from "../../data/zod";

export function parameterString(): data.StringParameterTransform<string>;
export function parameterString<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDecoder extends t.ZodType<string>,
>(customString: TDecoder): data.StringParameterTransform<t.infer<TDecoder>>;
export function parameterString<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDecoder extends t.ZodType<string>,
>(
  customString?: TDecoder,
): data.StringParameterTransform<string | t.infer<TDecoder>> {
  return common.plainValidator(customString ?? t.string());
}

const TRUE = "true" as const;
export const parameterBoolean = (): data.StringParameterTransform<boolean> =>
  data.transitiveDataValidation(
    common.plainValidator(t.union([t.literal(TRUE), t.literal("false")])),
    (str) => ({
      error: "none",
      data: str === TRUE,
    }),
  );

export const parameterISOTimestamp = (): data.StringParameterTransform<Date> =>
  data.transitiveDataValidation(common.plainValidator(t.string()), (str) => {
    try {
      const d = new Date(str);
      return isNaN(d.getTime())
        ? common.createErrorObject([
            new t.ZodError([
              {
                code: "custom",
                message: "Timestamp string was not ISO format",
                path: [],
              },
            ]),
          ])
        : {
            error: "none",
            data: d,
          };
    } catch {
      return common.createErrorObject([
        new t.ZodError([
          {
            code: "custom",
            message: "Timestamp string was not ISO format",
            path: [],
          },
        ]),
      ]);
    }
  });
