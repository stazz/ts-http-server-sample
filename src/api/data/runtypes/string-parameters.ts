import * as t from "runtypes";
import * as validate from "./validate";
import * as validateString from "./validate-string";

export function parameterString(): validateString.StringParameterTransform<t.String>;
export function parameterString<TDecoder extends validate.Decoder<string>>(
  customString: TDecoder,
): validateString.StringParameterTransform<TDecoder>;
export function parameterString<TDecoder extends validate.Decoder<string>>(
  customString?: TDecoder,
): validateString.StringParameterTransform<TDecoder | t.String> {
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

const parameterStringValue: validateString.StringParameterTransform<t.String> =
  {
    transform: (str) => str,
    validation: t.String,
  };

export const parameterBoolean = () =>
  // Copy to prevent modifications by caller
  ({ ...parameterBooleanValue });

const TRUE = "true" as const;
const parameterBooleanValue: validateString.StringParameterTransform<t.Boolean> =
  {
    validation: t.Boolean,
    stringValidation: t.Union(t.Literal(TRUE), t.Literal("false")),
    transform: (str) => str === TRUE,
  };
