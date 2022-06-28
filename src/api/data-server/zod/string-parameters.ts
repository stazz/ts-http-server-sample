import * as t from "zod";
import * as common from "../../data/zod";
import * as validateString from "./validate-string";

// TODO we might need overloads for optional string parameters
export function parameterString(): validateString.StringParameterTransform<
  t.ZodString,
  string
>;
export function parameterString<TDecoder extends common.Decoder<string>>(
  customString: TDecoder,
): validateString.StringParameterTransform<TDecoder, string>;
export function parameterString<TDecoder extends common.Decoder<string>>(
  customString?: TDecoder,
): validateString.StringParameterTransform<TDecoder | t.ZodString, string> {
  return customString
    ? {
        transform: (str) => str,
        validation: customString,
      }
    : {
        // Copy to prevent modifications by caller
        ...parameterStringValue,
      };
}

const parameterStringValue: validateString.StringParameterTransform<
  t.ZodString,
  string
> = {
  transform: (str) => str,
  validation: t.string(),
};

const TRUE = "true" as const;
export const parameterBoolean = (description?: string) =>
  validateString.stringParameterWithTransform(
    t.union([t.undefined(), t.literal(TRUE), t.literal("false")]),
    common.maybeDescribe(t.boolean(), description),
    (str) => str === TRUE,
  );
