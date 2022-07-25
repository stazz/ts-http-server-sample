import type * as jsonSchema from "json-schema";

export const createJsonSchemaFunctionality = <
  TTransformedSchema,
  TOutputContents extends TContentsBase,
  TInputContents extends TContentsBase,
>({
  transformSchema,
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
      (encoder) => transformSchema(override?.(encoder) ?? transform(encoder)),
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
      (decoder) => transformSchema(override?.(decoder) ?? transform(decoder)),
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
  TInput,
> = JSONSchemaFunctionalityCreationArgumentsBase<TTransformedSchema> &
  JSONSchemaFunctionalityCreationArgumentsContentTypesOnly<TKeys, TInput>;

export type JSONSchemaFunctionalityCreationArgumentsContentTypesOnly<
  TKeys extends string,
  TInput,
> = {
  contentTypes: Array<TKeys>;
  fallbackValue?: FallbackValue<TInput>;
};

export type FallbackValue<TInput> =
  | JSONSchema
  | ((input: TInput) => JSONSchema | undefined);

export interface SchemaTransformation<TInput> {
  override: Transformer<TInput, JSONSchema | undefined> | undefined;
  transform: (input: TInput) => JSONSchema;
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
) => TReturnType;

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

export const transformerFromConstructor =
  <TInput, TOutput>(
    ctor: Constructor<TInput>,
    tryTransform: Transformer<TInput, TOutput>,
  ): Transformer<unknown, TOutput | undefined> =>
  (input) =>
    input instanceof ctor ? tryTransform(input) : undefined;

export const transformerFromEquality =
  <TInput, TOutput>(
    value: TInput,
    tryTransform: Transformer<TInput, TOutput>,
  ): Transformer<unknown, TOutput | undefined> =>
  (input) =>
    input === value ? tryTransform(input as TInput) : undefined;

export const transformerFromMany =
  <TInput, TOutput>(
    matchers: Array<Transformer<TInput, TOutput | undefined>>,
  ): Transformer<TInput, TOutput | undefined> =>
  // TODO create a copy out of matchers to prevent modifications outside of this scope
  (input) => {
    // Reduce doesn't provide a way to break early out from the loop
    // We could use .every and return false, and inside lambda scope, modifying the result variable declared in this scope
    let result: TOutput | undefined;
    matchers.every((matcher) => (result = matcher(input)) === undefined);
    return result;
  };

export interface Constructor<V> {
  new (...args: any[]): V;
}

export const getFallbackValue = <TInput>(
  input: TInput | undefined,
  fallbackValue: FallbackValue<TInput>,
): JSONSchema =>
  typeof fallbackValue === "function"
    ? input === undefined
      ? getDefaultFallbackValue()
      : fallbackValue(input) ?? getDefaultFallbackValue()
    : fallbackValue;

export const getDefaultFallbackValue = (): JSONSchema => ({
  description:
    "This is fallback value for when JSON schema could not be generated from type validation object.",
});
