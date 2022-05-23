export type AppEndpointMetadata<TDataValidation> =
  | AppEndpointMetadataConcrete<TDataValidation>
  | AppEndpointMetadataCombined<TDataValidation>;
export interface AppEndpointMetadataConcrete<TDataValidation> {
  urlValidation?: ReadonlyArray<string | RegExp>;
  bodyValidation?: TDataValidation;
  outputValidation?: TDataValidation;
}

export interface AppEndpointMetadataCombined<TDataValidation> {
  prefix: string;
  endpointMetadatas: ReadonlyArray<AppEndpointMetadata<TDataValidation>>;
}
