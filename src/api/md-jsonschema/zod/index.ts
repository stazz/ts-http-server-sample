import type * as tPlugin from "../../data/zod";
import * as t from "zod";
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
            decoder,
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
  decoderToSchema(encoder.validation, fallbackValue);

const decoderToSchema = (
  decoder: Decoder,
  fallbackValue: FallbackValue,
): common.JSONSchema => {
  // Zod fallbacks to 'any' in many of its definitions of ZodFirstPartySchemaTypes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recursion = (innerValidation: any) =>
    innerValidation instanceof t.ZodType
      ? decoderToSchema(innerValidation as Decoder, fallbackValue)
      : common.getFallbackValue(undefined, fallbackValue);

  let retVal: common.JSONSchema | undefined;
  const def = (decoder as t.ZodFirstPartySchemaTypes)._def;
  switch (def.typeName) {
    case t.ZodFirstPartyTypeKind.ZodString:
      {
        retVal = {
          type: "string",
        };
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodBoolean:
      {
        retVal = {
          type: "boolean",
        };
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodNever:
      {
        retVal = false;
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodAny:
      {
        retVal = true;
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodNumber:
      {
        retVal = {
          type: "number",
        };
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodLiteral:
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { value } = def;
        retVal =
          value === null
            ? {
                type: "null",
              }
            : typeof value === "string" || typeof value === "boolean"
            ? {
                const: value,
              }
            : undefined;
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodArray:
      {
        retVal = {
          type: "array",
          items: recursion(def.type),
        };
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodObject:
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const entries = Object.entries(def.shape());
        retVal = {
          type: "object",
          properties: Object.fromEntries(
            entries.map(([propertyName, propertyValidation]) => [
              propertyName,
              recursion(propertyValidation),
            ]),
          ),
        };
        const required = entries.filter(
          ([, validation]) => !(validation instanceof t.ZodOptional),
        );
        if (required.length > 0) {
          retVal.required = required.map(([propertyName]) => propertyName);
        }
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodRecord:
      {
        retVal = {
          type: "object",
          propertyNames: recursion(def.keyType),
          additionalProperties: recursion(def.valueType),
        };
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodOptional:
      {
        retVal = recursion(def.innerType);
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodTuple:
      {
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodUnion:
    case t.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      {
      }
      break;
    case t.ZodFirstPartyTypeKind.ZodIntersection:
      {
      }
      break;
  }

  if (retVal && typeof retVal !== "boolean") {
    retVal.description = decoder.description;
  }
  return retVal ?? common.getFallbackValue(decoder, fallbackValue);
};
