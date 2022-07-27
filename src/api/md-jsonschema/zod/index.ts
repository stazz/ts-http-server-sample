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
            encoding.override,
            encoding.fallbackValue ?? common.getDefaultFallbackValue(),
          ),
        override: (encoder) => encoding.override?.(encoder.validation),
      }),
    ),
    decoders: common.arrayToRecord(
      decoding.contentTypes,
      (): common.SchemaTransformation<Decoder> => ({
        transform: (decoder) =>
          decoderToSchema(
            decoder,
            encoding.override,
            decoding.fallbackValue ?? common.getDefaultFallbackValue(),
          ),
        override: decoding.override,
      }),
    ),
    getUndefinedPossibility,
  });

export type Input<
  TTransformedSchema,
  TContentTypesEncoding extends string,
  TContentTypesDecoding extends string,
> = common.JSONSchemaFunctionalityCreationArgumentsBase<TTransformedSchema> & {
  encoding: InputForValidation<TContentTypesEncoding>;
  decoding: InputForValidation<TContentTypesDecoding>;
};

export type InputForValidation<TContentTypes extends string> =
  common.JSONSchemaFunctionalityCreationArgumentsContentTypesOnly<
    TContentTypes,
    Decoder
  > & {
    override?: common.Override<Decoder>;
  };
export type Encoder = tPlugin.Encoder<any, any>;
export type Decoder = tPlugin.Decoder<any>;
export type FallbackValue = common.FallbackValue<Decoder>;
export type Override = common.Override<Decoder>;

const encoderToSchema = (
  encoder: Encoder,
  override: Override | undefined,
  fallbackValue: FallbackValue,
): common.JSONSchema =>
  // TODO add customizability for e.g. ISO timestamps
  decoderToSchema(encoder.validation, override, fallbackValue);

const decoderToSchema = (
  decoder: Decoder,
  override: Override | undefined,
  fallbackValue: FallbackValue,
): common.JSONSchema => {
  // Zod fallbacks to 'any' in many of its definitions of ZodFirstPartySchemaTypes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recursion = (innerValidation: any) =>
    innerValidation instanceof t.ZodType
      ? decoderToSchema(innerValidation as Decoder, override, fallbackValue)
      : common.getFallbackValue(undefined, fallbackValue);

  let retVal = override?.(decoder);
  if (retVal === undefined) {
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
      case t.ZodFirstPartyTypeKind.ZodEffects:
        {
          retVal = recursion(def.schema);
        }
        break;
      case t.ZodFirstPartyTypeKind.ZodTuple:
        {
          retVal = {
            type: "array",
            items: (def.items as Array<Decoder>).map(recursion),
          };
        }
        break;
      case t.ZodFirstPartyTypeKind.ZodUnion:
      case t.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
        {
          retVal = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            anyOf: (def.typeName === t.ZodFirstPartyTypeKind.ZodUnion
              ? def.options
              : Array.from(def.options.values())
            ).map(recursion),
          };
        }
        break;
      case t.ZodFirstPartyTypeKind.ZodIntersection:
        {
          retVal = {
            allOf: [def.left, def.right].map(recursion),
          };
        }
        break;
    }

    if (retVal && typeof retVal !== "boolean") {
      retVal.description = decoder.description;
    }
  }
  return retVal ?? common.getFallbackValue(decoder, fallbackValue);
};

const getUndefinedPossibility = (validation: Decoder | Encoder) =>
  validation instanceof t.ZodType
    ? getUndefinedPossibilityDecoder(validation)
    : getUndefinedPossibilityDecoder(validation.validation);

const getUndefinedPossibilityDecoder = (
  decoder: Decoder,
): common.UndefinedPossibility => {
  const recursion = (val: unknown) =>
    val instanceof t.ZodType && getUndefinedPossibilityDecoder(val as Decoder);

  return (
    decoder instanceof t.ZodUndefined ||
    (decoder instanceof t.ZodIntersection &&
      recursion(decoder._def.left) &&
      recursion(decoder._def.right)) ||
    (decoder instanceof t.ZodUnion &&
      (decoder as t.ZodUnion<[t.ZodType]>)._def.options.some(recursion))
  );
};
