import type * as jsonSchema from "json-schema";

export const createJsonSchemaFunctionality = <
  TTransformedSchema,
  TOutputContents extends TContentsBase,
  TInputContents extends TContentsBase,
>({
  transformSchema,
  fallbackValue,
  encoders,
  decoders,
}: JSONSchemaFunctionalityCreationArgumentsGeneric<
  TTransformedSchema,
  TOutputContents,
  TInputContents
>): SupportedJSONSchemaFunctionality<
  TTransformedSchema,
  TOutputContents,
  TInputContents
> => ({
  encoders: Object.fromEntries(
    Object.entries(encoders).map<
      [
        keyof TOutputContents,
        SupportedJSONSchemaFunctionality<
          TTransformedSchema,
          TOutputContents,
          TInputContents
        >["encoders"][string],
      ]
    >(([contentType, { transform, override }]) => [
      contentType,
      (encoder) => {
        const retVal =
          override?.(encoder) ?? transform(encoder) ?? fallbackValue;
        return retVal ? transformSchema(retVal) : undefined;
      },
    ]),
  ) as unknown as SupportedJSONSchemaFunctionality<
    TTransformedSchema,
    TOutputContents,
    TInputContents
  >["encoders"],
  decoders: Object.fromEntries(
    Object.entries(decoders).map<
      [
        keyof TInputContents,
        SupportedJSONSchemaFunctionality<
          TTransformedSchema,
          TOutputContents,
          TInputContents
        >["decoders"][string],
      ]
    >(([contentType, { transform, override }]) => [
      contentType,
      (decoder) => {
        const retVal =
          override?.(decoder) ?? transform(decoder) ?? fallbackValue;

        return retVal ? transformSchema(retVal) : undefined;
      },
    ]),
  ) as unknown as SupportedJSONSchemaFunctionality<
    TTransformedSchema,
    TOutputContents,
    TInputContents
  >["decoders"],
});

export interface JSONSchemaFunctionalityCreationArgumentsBase<
  TTransformedSchema,
> {
  transformSchema: (schema: JSONSchema) => TTransformedSchema;
  fallbackValue?: JSONSchema;
}

export type JSONSchemaFunctionalityCreationArgumentsGeneric<
  TTransformedSchema,
  TOutputContents extends TContentsBase,
  TInputContents extends TContentsBase,
> = JSONSchemaFunctionalityCreationArgumentsBase<TTransformedSchema> & {
  encoders: TOutputContents;
  decoders: TInputContents;
};

export type JSONSchemaFunctionalityCreationArgumentsContentTypes<
  TTransformedSchema,
  TKeys extends string,
> = JSONSchemaFunctionalityCreationArgumentsBase<TTransformedSchema> & {
  contentTypes: Array<TKeys>;
};

export interface SchemaTransformation<TInput> {
  transform: Transformer<TInput>;
  override: Transformer<TInput> | undefined;
}

export type SupportedJSONSchemaFunctionality<
  TTransformedSchema,
  TOutputContents extends TContentsBase,
  TInputContents extends TContentsBase,
> = {
  encoders: {
    [P in keyof TOutputContents]: Transformer<
      GetInput<TOutputContents[P]>,
      TTransformedSchema
    >;
  };
  decoders: {
    [P in keyof TInputContents]: Transformer<
      GetInput<TInputContents[P]>,
      TTransformedSchema
    >;
  };
};

export type Transformer<TInput, TReturnType = JSONSchema> = (
  input: TInput,
) => TReturnType | undefined;

export type JSONSchema = jsonSchema.JSONSchema7Definition;

export const arrayToRecord = <TKeys extends string, TValue>(
  keys: Array<TKeys>,
  createValue: (key: TKeys) => TValue,
) =>
  Object.fromEntries(keys.map((key) => [key, createValue(key)])) as Record<
    TKeys,
    TValue
  >;

export type TContentsBase = Record<string, SchemaTransformation<any>>;

export type GetInput<TSchemaTransformation> =
  TSchemaTransformation extends SchemaTransformation<infer T> ? T : never;
