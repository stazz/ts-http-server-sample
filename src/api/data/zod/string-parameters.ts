import * as t from "zod";
import * as utils from "./utils";
import * as validate from "./validate";
import * as validateString from "./validate-string";

// TODO we might need overloads for optional string parameters
export function parameterString(): validateString.StringParameterTransform<
  t.ZodString,
  string
>;
export function parameterString<TDecoder extends validate.Decoder<string>>(
  customString: TDecoder,
): validateString.StringParameterTransform<TDecoder, string>;
export function parameterString<TDecoder extends validate.Decoder<string>>(
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
    utils.maybeDescribe(t.boolean(), description),
    (str) => str === TRUE,
  );
