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

const TRUE = "true" as const;
export const parameterBoolean = () =>
  validateString.stringParameterWithTransform(
    t.keyof({ [TRUE]: "", false: "" }),
    t.boolean,
    (str) => str === TRUE,
  );
