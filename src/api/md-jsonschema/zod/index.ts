import type * as tPlugin from "../../data/zod";
import * as common from "../common";

export const createJsonSchemaFunctionality = <
  TTransformedSchema,
  TContentTypes extends string,
>({
  contentTypes,
  overrideEncoder,
  overrideDecoder,
  ...args
}: Input<TTransformedSchema, TContentTypes>) =>
  common.createJsonSchemaFunctionality({
    ...args,
    encoders: common.arrayToRecord(
      contentTypes,
      (): common.SchemaTransformation<Encoder> => ({
        transform: encoderToSchema,
        override: overrideEncoder,
      }),
    ),
    decoders: common.arrayToRecord(
      contentTypes,
      (): common.SchemaTransformation<Decoder> => ({
        transform: decoderToSchema,
        override: overrideDecoder,
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
  overrideEncoder?: common.Transformer<Encoder>;
  overrideDecoder?: common.Transformer<Decoder>;
};
export type Encoder = tPlugin.Encoder<any, any>;
export type Decoder = tPlugin.Decoder<any>;

const encoderToSchema: common.Transformer<Encoder> = (encoder) => ({
  type: "string",
});

const decoderToSchema: common.Transformer<Decoder> = () => ({
  type: "string",
});
