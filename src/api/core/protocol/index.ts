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

export interface ProtocolSpecRequestBody<TInput> {
  requestBody: TInput;
}

// This is purely virtual interface for type deduction.
// No instances of this interface are meant to exist, therefore "& never" for field values.
export interface Encoded<TRuntime, TEncoded> {
  __runtime: TRuntime & never;
  __encoded: TEncoded & never;
}
