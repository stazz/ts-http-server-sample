import * as t from "runtypes";
import * as common from "../../data/runtypes";
import * as validateString from "./validate-string";

// TODO we might need overloads for optional string parameters
export function parameterString(): validateString.StringParameterTransform<
  t.String,
  string
>;
export function parameterString<TDecoder extends common.Decoder<string>>(
  customString: TDecoder,
): validateString.StringParameterTransform<TDecoder, string>;
export function parameterString<TDecoder extends common.Decoder<string>>(
  customString?: TDecoder,
): validateString.StringParameterTransform<TDecoder | t.String, string> {
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
  t.String,
  string
> = {
  transform: (str) => str,
  validation: t.String,
};

const TRUE = "true" as const;
export const parameterBoolean = () =>
  validateString.stringParameterWithTransform(
    t.Union(t.Undefined, t.Literal(TRUE), t.Literal("false")),
    t.Boolean,
    (str) => str === TRUE,
  );
