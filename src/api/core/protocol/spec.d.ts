export interface ProtocolSpecCore<TMethod extends string, TOutput> {
  method: TMethod;
  responseBody: TOutput;
}

export interface ProtocolSpecHeaders<THeaders extends Record<string, string>> {
  // Key: header name
  // Value: functionality ID
  headers: THeaders;
}

export interface ProtocolSpecURL<TURLData extends Record<string, unknown>> {
  url: TURLData;
}

export interface ProtocolSpecQuery<TQueryData extends Record<string, unknown>> {
  query: TQueryData;
}

export interface ProtocolSpecHeaderData<
  THeaderData extends Record<string, unknown>,
> {
  headerData: THeaderData;
}

export interface ProtocolSpecRequestBody<TInput> {
  requestBody: TInput;
}
