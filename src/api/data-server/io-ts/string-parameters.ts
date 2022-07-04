import * as t from "io-ts";
import * as tt from "io-ts-types";
import * as common from "../../data/io-ts";
import * as validateString from "./validate-string";

// TODO we might need overloads for optional string parameters
export function parameterString(): validateString.StringParameterTransform<
  t.StringType,
  string
>;
export function parameterString<
  TDecoder extends common.Decoder<string> & t.Mixed,
>(
  customString: TDecoder,
): validateString.StringParameterTransform<TDecoder, string>;
export function parameterString<
  TDecoder extends common.Decoder<string> & t.Mixed,
>(
  customString?: TDecoder,
): validateString.StringParameterTransform<TDecoder | t.StringType, string> {
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
  t.StringType,
  string
> = {
  transform: (str) => str,
  validation: t.string,
};

const TRUE = "true" as const;
export const parameterBoolean = () =>
  validateString.stringParameterWithTransform(
    t.union([t.undefined, t.keyof({ [TRUE]: "", false: "" })]),
    t.boolean,
    (str) => str === TRUE,
  );

export const parameterISOTimestamp =
  (): validateString.StringParameterTransform<tt.DateFromISOStringC, Date> => ({
    validation: tt.DateFromISOString,
    transform: (date) => date,
  });
