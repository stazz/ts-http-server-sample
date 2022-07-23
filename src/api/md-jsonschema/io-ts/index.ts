import type * as jsonSchema from "json-schema";
import type * as tPlugin from "../../data/io-ts";
import type * as t from "io-ts";

export const createJsonSchemaFunctionality = <
  TContentTypes extends string,
  TTransformedSchema,
>({
  contentTypes,
  transformSchema,
  customLookup,
  fallbackValue,
}: JSONSchemaFunctionalityCreationArguments<
  TContentTypes,
  TTransformedSchema
>): SupportedJSONSchemaFunctionality<TContentTypes, TTransformedSchema> => ({
  encoders: Object.fromEntries(
    contentTypes.map<[TContentTypes, Transformer<Encoder, TTransformedSchema>]>(
      (contentType) => [
        contentType,
        (encoder) => {
          const retVal =
            customLookup?.(encoder) ??
            encoderToSchema(encoder) ??
            fallbackValue;
          return retVal ? transformSchema(retVal) : undefined;
        },
      ],
    ),
  ) as SupportedJSONSchemaFunctionality<
    TContentTypes,
    TTransformedSchema
  >["encoders"],
});

export interface JSONSchemaFunctionalityCreationArguments<
  TContentTypes extends string,
  TTransformedSchema,
> {
  contentTypes: Array<TContentTypes>;
  transformSchema: (schema: JSONSchema) => TTransformedSchema;
  customLookup?: (encoder: Encoder) => JSONSchema | undefined;
  fallbackValue?: JSONSchema;
}

export type SupportedJSONSchemaFunctionality<
  TContentTypes extends string,
  TTransformedSchema,
> = {
  encoders: { [P in TContentTypes]: Transformer<Encoder, TTransformedSchema> };
};

export type Encoder = tPlugin.Encoder<any, any>;

export type Transformer<TInput, TReturnType = JSONSchema> = (
  input: TInput,
) => TReturnType | undefined;

export type JSONSchema = jsonSchema.JSONSchema7Definition;

const encoderToSchema: Transformer<Encoder> = (encoder) => {
  if ("_tag" in encoder) {
    const tag = encoder._tag;
    switch (tag) {
      case "NullType": {
        return {
          type: "null",
        };
      }
      case "UndefinedType": {
        return undefined;
      }
      case "VoidType": {
        return undefined;
      }
      case "UnknownType": {
        return undefined;
      }
      case "StringType": {
        return {
          type: "string",
        };
      }
      case "NumberType": {
        return {
          type: "number",
        };
      }
      case "BigIntType": {
        return undefined;
      }
      case "BooleanType": {
        return {
          type: "boolean",
        };
      }
      case "AnyArrayType": {
        return {
          type: "array",
        };
      }
      case "AnyDictionaryType": {
        return undefined;
      }
      case "LiteralType": {
        return undefined;
      }
      case "KeyofType": {
        return undefined;
      }
      case "RefinementType": {
        return undefined;
      }
      case "RecursiveType": {
        return undefined;
      }
      case "ArrayType": {
        return {
          type: "array",
          items: encoderToSchema((encoder as t.ArrayType<t.Any>).type),
        };
      }
      case "InterfaceType": {
        return undefined;
      }
      case "PartialType": {
        return undefined;
      }
      case "DictionaryType": {
        return undefined;
      }
      case "UnionType": {
        return undefined;
      }
      case "IntersectionType": {
        return undefined;
      }
      case "TupleType": {
        return undefined;
      }
      case "ReadonlyType": {
        return undefined;
      }
      case "ReadonlyArrayType": {
        return undefined;
      }
      case "ExactType": {
        return undefined;
      }
      case "FunctionType": {
        return undefined;
      }
      case "NeverType": {
        return undefined;
      }
      case "AnyType": {
        return undefined;
      }
      case "ObjectType": {
        return undefined;
      }
      case "StrictType": {
        return undefined;
      }
    }
  }
};
