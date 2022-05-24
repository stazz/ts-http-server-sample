export type AppEndpointMetadata<TDataSchemaTypes> =
  | AppEndpointMetadataConcrete<TDataSchemaTypes>
  | AppEndpointMetadataCombined<TDataSchemaTypes>;

export interface AppEndpointMetadataConcrete<TDataSchemaTypes> {
  urlValidation?: ReadonlyArray<string | RegExp>;
  dataValidation: {
    [P in keyof TDataSchemaTypes]: P extends string
      ? AppEndpointDataForContentType<P, TDataSchemaTypes[P]>
      : never;
  };
}

export interface AppEndpointMetadataCombined<TDataSchemaTypes> {
  prefix: string;
  endpointMetadatas: ReadonlyArray<AppEndpointMetadata<TDataSchemaTypes>>;
}

export interface AppEndpointDataForContentType<
  TContentType extends string,
  TDataSchema,
> {
  contentType: TContentType;
  bodyValidation?: TDataSchema;
  outputValidation?: TDataSchema;
}
