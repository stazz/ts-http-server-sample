import type * as tPlugin from "../../data/runtypes";
import * as t from "runtypes";
import * as common from "../common";

export const createJsonSchemaFunctionality = <
  TTransformedSchema,
  TContentTypesEncoding extends string,
  TContentTypesDecoding extends string,
>({
  encoding,
  decoding,
  ...args
}: Input<TTransformedSchema, TContentTypesEncoding, TContentTypesDecoding>) =>
  common.createJsonSchemaFunctionality({
    ...args,
    encoders: common.arrayToRecord(
      encoding.contentTypes,
      (): common.SchemaTransformation<Encoder> => ({
        transform: (encoder) =>
          encoderToSchema(
            encoder,
            encoding.fallbackValue ?? common.getDefaultFallbackValue(),
          ),
        override: encoding.override,
      }),
    ),
    decoders: common.arrayToRecord(
      decoding.contentTypes,
      (): common.SchemaTransformation<Decoder> => ({
        transform: (decoder) =>
          decoderToSchema(
            decoder.reflect,
            decoding.fallbackValue ?? common.getDefaultFallbackValue(),
          ),
        override: decoding.override,
      }),
    ),
  });

export type Input<
  TTransformedSchema,
  TContentTypesEncoding extends string,
  TContentTypesDecoding extends string,
> = common.JSONSchemaFunctionalityCreationArgumentsBase<TTransformedSchema> & {
  encoding: InputForValidation<Encoder, TContentTypesEncoding>;
  decoding: InputForValidation<Decoder, TContentTypesDecoding>;
};

export type InputForValidation<
  TValidation,
  TContentTypes extends string,
> = common.JSONSchemaFunctionalityCreationArgumentsContentTypesOnly<
  TContentTypes,
  Decoder
> & {
  override?: common.Transformer<TValidation>;
};

export type Encoder = tPlugin.Encoder<any, any>;
export type Decoder = tPlugin.Decoder<any>;
export type FallbackValue = common.FallbackValue<Decoder>;

const encoderToSchema = (
  encoder: Encoder,
  fallbackValue: FallbackValue,
): common.JSONSchema =>
  // TODO add customizability for e.g. ISO timestamps
  decoderToSchema(encoder.validation.reflect, fallbackValue);

const decoderToSchema = (
  decoder: t.Reflect,
  fallbackValue: FallbackValue,
): common.JSONSchema => {
  const recursion = (innerValidation: t.Reflect) =>
    decoderToSchema(innerValidation, fallbackValue);
  let retVal: common.JSONSchema | undefined;
  const reflect = decoder.reflect;
  switch (reflect.tag) {
    case "string":
    case "template":
      {
        retVal = {
          type: "string",
        };
      }
      break;
    case "number":
      {
        retVal = {
          type: "number",
        };
      }
      break;
    case "boolean":
      {
        retVal = {
          type: "boolean",
        };
      }
      break;
    case "never":
      {
        retVal = false;
      }
      break;
    case "literal":
      {
        const { value } = reflect;
        retVal =
          value === null
            ? {
                type: "null",
              }
            : value === undefined || typeof value === "bigint"
            ? undefined
            : {
                const: value,
              };
      }
      break;
    case "constraint":
    case "optional":
      {
        retVal = recursion(reflect.underlying);
      }
      break;
    case "array":
      {
        retVal = {
          type: "array",
          items: recursion(reflect.element),
        };
      }
      break;
    case "record":
      {
        const entries = Object.entries(reflect.fields);
        retVal = {
          type: "object",
          properties: Object.fromEntries(
            entries.map(([fieldName, fieldValidation]) => [
              fieldName,
              recursion(fieldValidation),
            ]),
          ),
        };
        if (!reflect.isPartial) {
          retVal.required = entries.map(([fieldName]) => fieldName);
        }
      }
      break;
    case "dictionary":
      {
        if (reflect.key != "symbol") {
          retVal = {
            type: "object",
            propertyNames: {
              type: reflect.key,
            },
            additionalProperties: recursion(reflect.value),
          };
        }
      }
      break;
    case "tuple":
      {
        retVal = {
          type: "array",
          items: reflect.components.map(recursion),
        };
      }
      break;
    case "intersect":
      {
        retVal = {
          allOf: reflect.intersectees.map(recursion),
        };
      }
      break;
    case "union":
      {
        retVal = {
          anyOf: reflect.alternatives.map(recursion),
        };
      }
      break;
  }
  // No description in runtypes...
  return retVal ?? common.getFallbackValue(decoder, fallbackValue);
};
