import * as t from "io-ts";
import * as validate from "./validate";
import * as validateString from "./validate-string";

export function parameterString(): validateString.StringParameterTransform<t.StringType>;
export function parameterString<
  TDecoder extends validate.Decoder<string> & t.Mixed,
>(customString: TDecoder): validateString.StringParameterTransform<TDecoder>;
export function parameterString<
  TDecoder extends validate.Decoder<string> & t.Mixed,
>(
  customString?: TDecoder,
): validateString.StringParameterTransform<TDecoder | t.StringType> {
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

const parameterStringValue: validateString.StringParameterTransform<t.StringType> =
  {
    transform: (str) => str,
    validation: t.string,
  };

export const parameterBoolean = () =>
  // Copy to prevent modifications by caller
  ({ ...parameterBooleanValue });

const parameterBooleanValue: validateString.StringParameterTransform<t.BooleanType> =
  {
    validation: t.boolean,
    stringValidation: t.keyof({ true: "", false: "" }),
    transform: (str) => str === "true",
  };
