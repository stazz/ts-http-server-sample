import * as method from "./method";

// TContentTypes could be for example:
// {
//    "application/json": t.Type<unknown>
// }
export interface AppEndpointMetadata<TContentTypes> {
  method: method.HttpMethod;
  urlValidation?: ReadonlyArray<string | RegExp>;
  dataValidation: {
    [P in keyof TContentTypes]: P extends string
      ? AppEndpointDataForContentType<P, TContentTypes[P]>
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
