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
          encoderToSchema(encoder, encoding.fallbackValue),
        override: encoding.override,
      }),
    ),
    decoders: common.arrayToRecord(
      decoding.contentTypes,
      (): common.SchemaTransformation<Decoder> => ({
        transform: (decoder) =>
          decoderToSchema(decoder, decoding.fallbackValue),
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
> = common.JSONSchemaFunctionalityCreationArgumentsContentTypesOnly<TContentTypes> & {
  override?: common.Transformer<TValidation>;
};
export type Encoder = tPlugin.Encoder<any, any>;
export type Decoder = tPlugin.Decoder<any>;

const encoderToSchema = (
  encoder: Encoder,
  fallbackValue: common.JSONSchema,
): common.JSONSchema =>
  // TODO add customizability for e.g. ISO timestamps
  decoderToSchema(encoder.validation, fallbackValue);

const decoderToSchema = (
  decoder: Decoder,
  fallbackValue: common.JSONSchema,
): common.JSONSchema => {
  const recursion = (innerValidation: Decoder) =>
    decoderToSchema(innerValidation, fallbackValue);

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
  }

  if (retVal && typeof retVal !== "boolean") {
    retVal.description = decoder.description;
  }
  return retVal ?? fallbackValue;
};
