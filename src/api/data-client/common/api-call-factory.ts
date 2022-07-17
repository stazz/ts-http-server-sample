import type * as protocol from "../../core/protocol";
import * as data from "../../core/data";

// These 16 overloads are a bit fugly but oh well...
export interface APICallFactory<
  THKTEncoded extends protocol.HKTEncoded,
  THeaders extends string,
  TError,
> {
  // Overloads for 1-form
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> & {
      [P in keyof (protocol.ProtocolSpecHeaders<Record<string, string>> &
        protocol.ProtocolSpecQuery<Record<string, unknown>> &
        protocol.ProtocolSpecRequestBody<unknown> &
        protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
    },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL,
  ): APICall<THKTEncoded, void, TProtocolSpec["responseBody"], TError>;

  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecHeaders<Record<string, THeaders>> & {
        [P in keyof (protocol.ProtocolSpecQuery<Record<string, unknown>> &
          protocol.ProtocolSpecRequestBody<unknown> &
          protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL,
  ): APICall<THKTEncoded, void, TProtocolSpec["responseBody"], TError>;

  // Overloads for 2-forms
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecQuery<Record<string, unknown>> & {
        [P in keyof (protocol.ProtocolSpecHeaders<Record<string, string>> &
          protocol.ProtocolSpecRequestBody<unknown> &
          protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError>,
  ): APICall<
    THKTEncoded,
    { query: TProtocolSpec["query"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
      protocol.ProtocolSpecQuery<Record<string, unknown>> & {
        [P in keyof (protocol.ProtocolSpecRequestBody<unknown> &
          protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError>,
  ): APICall<
    THKTEncoded,
    { query: TProtocolSpec["query"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecRequestBody<unknown> & {
        [P in keyof (protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
          protocol.ProtocolSpecQuery<Record<string, unknown>> &
          protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): APICall<
    THKTEncoded,
    { body: TProtocolSpec["requestBody"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
      protocol.ProtocolSpecRequestBody<unknown> & {
        [P in keyof (protocol.ProtocolSpecQuery<Record<string, unknown>> &
          protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): APICall<
    THKTEncoded,
    { body: TProtocolSpec["requestBody"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecURL<Record<string, unknown>> & {
        [P in keyof (protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
          protocol.ProtocolSpecRequestBody<unknown> &
          protocol.ProtocolSpecQuery<Record<string, unknown>>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<THKTEncoded, TProtocolSpec["url"], TError>,
  ): APICall<
    THKTEncoded,
    { url: TProtocolSpec["url"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
      protocol.ProtocolSpecURL<Record<string, unknown>> & {
        [P in keyof (protocol.ProtocolSpecRequestBody<unknown> &
          protocol.ProtocolSpecQuery<Record<string, unknown>>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<THKTEncoded, TProtocolSpec["url"], TError>,
  ): APICall<
    THKTEncoded,
    { url: TProtocolSpec["url"] },
    TProtocolSpec["responseBody"],
    TError
  >;

  // Overloads for 3-forms
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecQuery<Record<string, unknown>> &
      protocol.ProtocolSpecRequestBody<unknown> & {
        [P in keyof (protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
          protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): APICall<
    THKTEncoded,
    { query: TProtocolSpec["query"]; body: TProtocolSpec["requestBody"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
      protocol.ProtocolSpecQuery<Record<string, unknown>> &
      protocol.ProtocolSpecRequestBody<unknown> & {
        [P in keyof protocol.ProtocolSpecURL<Record<string, unknown>>]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): APICall<
    THKTEncoded,
    { query: TProtocolSpec["query"]; body: TProtocolSpec["requestBody"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecQuery<Record<string, unknown>> &
      protocol.ProtocolSpecURL<Record<string, unknown>> & {
        [P in keyof (protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
          protocol.ProtocolSpecRequestBody<unknown>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<THKTEncoded, TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError>,
  ): APICall<
    THKTEncoded,
    { query: TProtocolSpec["query"]; url: TProtocolSpec["url"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
      protocol.ProtocolSpecQuery<Record<string, unknown>> &
      protocol.ProtocolSpecURL<Record<string, unknown>> & {
        [P in keyof protocol.ProtocolSpecRequestBody<unknown>]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<THKTEncoded, TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError>,
  ): APICall<
    THKTEncoded,
    { query: TProtocolSpec["query"]; url: TProtocolSpec["url"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecRequestBody<unknown> &
      protocol.ProtocolSpecURL<Record<string, unknown>> & {
        [P in keyof (protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
          protocol.ProtocolSpecQuery<Record<string, unknown>>)]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<THKTEncoded, TProtocolSpec["url"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): APICall<
    THKTEncoded,
    { body: TProtocolSpec["requestBody"]; url: TProtocolSpec["url"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
      protocol.ProtocolSpecRequestBody<unknown> &
      protocol.ProtocolSpecURL<Record<string, unknown>> & {
        [P in keyof protocol.ProtocolSpecQuery<
          Record<string, unknown>
        >]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<THKTEncoded, TProtocolSpec["url"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): APICall<
    THKTEncoded,
    { body: TProtocolSpec["requestBody"]; url: TProtocolSpec["url"] },
    TProtocolSpec["responseBody"],
    TError
  >;

  // Overloads for 4-form
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecQuery<Record<string, unknown>> &
      protocol.ProtocolSpecRequestBody<unknown> &
      protocol.ProtocolSpecURL<Record<string, unknown>> & {
        [P in keyof protocol.ProtocolSpecHeaders<
          Record<string, THeaders>
        >]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<THKTEncoded, TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): APICall<
    THKTEncoded,
    {
      query: TProtocolSpec["query"];
      body: TProtocolSpec["requestBody"];
      url: TProtocolSpec["url"];
    },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
      protocol.ProtocolSpecQuery<Record<string, unknown>> &
      protocol.ProtocolSpecRequestBody<unknown> &
      protocol.ProtocolSpecURL<Record<string, unknown>>,
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      THKTEncoded,
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<THKTEncoded, TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): APICall<
    THKTEncoded,
    {
      query: TProtocolSpec["query"];
      body: TProtocolSpec["requestBody"];
      url: TProtocolSpec["url"];
    },
    TProtocolSpec["responseBody"],
    TError
  >;
}

export type APICall<
  THKTEncoded extends protocol.HKTEncoded,
  TArgs,
  TReturnType,
  TError,
> = (args: protocol.RuntimeOf<THKTEncoded, TArgs>) => Promise<
  | data.DataValidatorResult<
      protocol.RuntimeOf<THKTEncoded, TReturnType>,
      TError
    >
  | {
      error: "error-input";
      errorInfo: Partial<{
        [P in "method" | "url" | "query" | "body"]: data.GetError<
          data.DataValidatorResultError<TError>
        >;
      }>;
    }
>;

export interface MakeAPICallArgs<
  THKTEncoded extends protocol.HKTEncoded,
  TMethod,
  TResponse,
  TError,
> {
  method: data.DataValidator<unknown, TMethod, TError>;
  response: data.DataValidator<
    unknown,
    protocol.RuntimeOf<THKTEncoded, TResponse>,
    TError
  >;
}

export interface MakeAPICallArgsHeaders<
  THeaders extends Record<string, string>,
> {
  headers: THeaders;
}

export interface MakeAPICallArgsURL {
  url: string;
}

export interface MakeAPICallArgsURLData<
  THKTEncoded extends protocol.HKTEncoded,
  TURLData,
  TError,
> {
  url: data.DataValidator<
    protocol.RuntimeOf<THKTEncoded, TURLData>,
    string,
    TError
  >;
}

export interface MakeAPICallArgsQuery<
  THKTEncoded extends protocol.HKTEncoded,
  TQueryData,
  TError,
> {
  query: data.DataValidator<
    protocol.RuntimeOf<THKTEncoded, TQueryData>,
    protocol.EncodedOf<THKTEncoded, TQueryData>,
    TError
  >;
}

export interface MakeAPICallArgsBody<
  THKTEncoded extends protocol.HKTEncoded,
  TBodyData,
  TError,
> {
  body: data.DataValidator<
    protocol.RuntimeOf<THKTEncoded, TBodyData>,
    protocol.EncodedOf<THKTEncoded, TBodyData>,
    TError
  >;
}
