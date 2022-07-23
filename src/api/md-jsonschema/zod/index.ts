import type * as jsonSchema from "json-schema";
import type * as tPlugin from "../../data/zod";

export const createJsonSchemaFunctionality = <
  TContentTypes extends string,
  TTransformedSchema,
>({
  contentTypes,
  transformSchema,
  customLookup,
}: JSONSchemaFunctionalityCreationArguments<
  TContentTypes,
  TTransformedSchema
>): SupportedJSONSchemaFunctionality<TContentTypes, TTransformedSchema> => ({
  encoders: Object.fromEntries(
    contentTypes.map<[string, Transformer<Encoder, TTransformedSchema>]>(
      (contentType) => [
        contentType,
        (encoder) => {
          const retVal = customLookup?.(encoder) ?? encoderToSchema(encoder);
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

const encoderToSchema: Transformer<Encoder> = (encoder) => ({
  type: "string",
});
