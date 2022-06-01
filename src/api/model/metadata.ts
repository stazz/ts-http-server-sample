import * as method from "./methods";

// TContentTypes could be for example:
// {
//    "application/json": t.Type<unknown>
// }
export interface AppEndpointMetadata<
  TInputContentTypes,
  TOuputContentTypes,
  TParameterDataSchema,
> {
  method: method.HttpMethod;
  urlValidation: ReadonlyArray<
    | string
    | {
        match: RegExp;
        validation: AppEndpointDataForParameter<TParameterDataSchema>;
      }
  >;
  queryValidation: {
    [P in keyof TInputContentTypes]: P extends string
      ? AppEndpointDataForParameter<TParameterDataSchema>
      : never;
  };
  inputValidation: {
    [P in keyof TInputContentTypes]: P extends string
      ? AppEndpointDataForContentType<P, TInputContentTypes[P]>
      : never;
  };
  outputValidation: {
    [P in keyof TOuputContentTypes]: P extends string
      ? AppEndpointDataForContentType<P, TOuputContentTypes[P]>
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
