import * as method from "./method";

// TContentTypes could be for example:
// {
//    "application/json": t.Type<unknown>
// }
export interface AppEndpointMetadata<TContentTypes> {
  method: method.HttpMethod;
  urlValidation?: ReadonlyArray<
    | string
    | {
        name: string;
        match: RegExp;
      }
  >;
  inputValidation: {
    [P in keyof TContentTypes]: P extends string
      ? AppEndpointDataForContentType<P, TContentTypes[P]>
      : never;
  };
  outputValidation: {
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
}
