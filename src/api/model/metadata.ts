import * as method from "./method";

// TDataSchemaTypes could be for example:
// {
//    "application/json": t.Type<unknown>
// }
export interface AppEndpointMetadata<TDataSchemaTypes> {
  method: method.HttpMethod;
  urlValidation?: ReadonlyArray<string | RegExp>;
  dataValidation: {
    [P in keyof TDataSchemaTypes]: P extends string
      ? AppEndpointDataForContentType<P, TDataSchemaTypes[P]>
      : never;
  };
}

export interface AppEndpointDataForContentType<
  TContentType extends string,
  TDataSchema,
> {
  contentType: TContentType;
  bodyValidation?: TDataSchema;
  outputValidation?: TDataSchema;
}
