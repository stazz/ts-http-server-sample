import * as method from "./method";

// TContentTypes could be for example:
// {
//    "application/json": t.Type<unknown>
// }
export interface AppEndpointMetadata<TContentTypes, TParameterDataSchema> {
  method: method.HttpMethod;
  urlValidation: ReadonlyArray<
    | string
    | {
        match: RegExp;
        validation: AppEndpointDataForParameter<TParameterDataSchema>;
      }
  >;
  queryValidation: {
    [P in keyof TContentTypes]: P extends string
      ? AppEndpointDataForParameter<TParameterDataSchema>
      : never;
  };
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

export interface AppEndpointDataForParameter<TDataSchema> {
  parameterName: string;
  parameterValidation: TDataSchema;
}
