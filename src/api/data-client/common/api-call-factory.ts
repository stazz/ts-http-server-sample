import type * as protocol from "../../core/protocol";
import type * as data from "../../core/data";
import type * as apiCall from "./api-call";

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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;

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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;

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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;

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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;

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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
      protocol.ProtocolSpecHeaders<Record<string, THeaders>> &
      protocol.ProtocolSpecQuery<Record<string, unknown>> &
      protocol.ProtocolSpecRequestBody<unknown> &
      protocol.ProtocolSpecURL<Record<string, unknown>>,
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"], TError>,
  ): apiCall.GetAPICall<TProtocolSpec, TError>;
}

export interface MakeAPICallArgs<TMethod, TResponse, TError> {
  method: data.DataValidator<unknown, TMethod, TError>;
  response: data.DataValidator<unknown, protocol.RuntimeOf<TResponse>, TError>;
}

export interface MakeAPICallArgsHeaders<
  THeaders extends Record<string, string>,
> {
  headers: THeaders;
}

export interface MakeAPICallArgsURL {
  url: string;
}

export interface MakeAPICallArgsURLData<TURLData, TError> {
  url: data.DataValidator<protocol.RuntimeOf<TURLData>, string, TError>;
}

export interface MakeAPICallArgsQuery<
  THKTEncoded extends protocol.HKTEncoded,
  TQueryData,
  TError,
> {
  query: data.DataValidator<
    protocol.RuntimeOf<TQueryData>,
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
    protocol.RuntimeOf<TBodyData>,
    protocol.EncodedOf<THKTEncoded, TBodyData>,
    TError
  >;
}
