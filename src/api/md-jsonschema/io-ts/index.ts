import type * as tPlugin from "../../data/io-ts";
import type * as t from "io-ts";
import * as common from "../common";

export const createJsonSchemaFunctionality = <
  TTransformedSchema,
  TContentTypes extends string,
>({
  contentTypes,
  override,
  ...args
}: Input<TTransformedSchema, TContentTypes>) =>
  common.createJsonSchemaFunctionality({
    ...args,
    encoders: common.arrayToRecord(
      contentTypes,
      (): common.SchemaTransformation<Encoder> => ({
        transform: encoderToSchema,
        override,
      }),
    ),
    decoders: common.arrayToRecord(
      contentTypes,
      (): common.SchemaTransformation<Decoder> => ({
        transform: encoderToSchema,
        override,
      }),
    ),
  });

export type Input<
  TTransformedSchema,
  TContentTypes extends string,
> = common.JSONSchemaFunctionalityCreationArgumentsContentTypes<
  TTransformedSchema,
  TContentTypes
> & {
  override?: common.Transformer<Encoder | Decoder>;
};

export type Encoder = tPlugin.Encoder<any, any>;
export type Decoder = tPlugin.Decoder<any>;

const encoderToSchema: common.Transformer<Encoder | Decoder> = (validation) => {
  if ("_tag" in validation) {
    const type = validation as AllTypes;
    const tag = type._tag;
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
          items: encoderToSchema((validation as t.ArrayType<t.Any>).type),
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

type AllTypes =
  | t.NullType
  | t.UndefinedType
  | t.VoidType
  | t.UnknownType
  | t.StringType
  | t.NumberType
  | t.BigIntType
  | t.BooleanType
  | t.AnyArrayType
  | t.AnyDictionaryType
  | t.LiteralType<any>
  | t.KeyofType<Record<string, unknown>>
  | t.RefinementType<t.Any>
  | t.RecursiveType<t.Any>
  | t.ArrayType<t.Any>
  | t.InterfaceType<Record<string, t.Any>>
  | t.PartialType<Record<string, t.Any>>
  | t.DictionaryType<t.Any, t.Any>
  | t.UnionType<Array<t.Any>>
  | t.IntersectionType<Array<t.Any>>
  | t.TupleType<Array<t.Any>>
  | t.ReadonlyType<t.Any>
  | t.ReadonlyArrayType<t.Any>
  | t.ExactType<t.Any>
  | t.FunctionType
  | t.NeverType
  | t.AnyType
  | t.ObjectType
  | t.StrictType<t.Any>;
