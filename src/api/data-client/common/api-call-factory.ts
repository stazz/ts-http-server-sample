import type * as protocol from "../../core/protocol";
import type * as data from "../../core/data";
import type * as apiCall from "./api-call";

// These 16 overloads are a bit fugly but oh well...
export interface APICallFactory<
  THKTEncoded extends protocol.HKTEncoded,
  THeaders extends string,
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsURL,
  ): apiCall.GetAPICall<TProtocolSpec>;

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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL,
  ): apiCall.GetAPICall<TProtocolSpec>;

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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;

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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"]> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"]> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"]> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"]> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"]> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"]> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;

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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"]> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"]> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
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
      TProtocolSpec["responseBody"]
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"]> &
      MakeAPICallArgsQuery<THKTEncoded, TProtocolSpec["query"]> &
      MakeAPICallArgsBody<THKTEncoded, TProtocolSpec["requestBody"]>,
  ): apiCall.GetAPICall<TProtocolSpec>;
}

export interface MakeAPICallArgs<TMethod, TResponse> {
  method: data.DataValidator<unknown, TMethod>;
  response: data.DataValidator<unknown, protocol.RuntimeOf<TResponse>>;
}

export interface MakeAPICallArgsHeaders<
  THeaders extends Record<string, string>,
> {
  headers: THeaders;
}

export interface MakeAPICallArgsURL {
  url: string;
}

export interface MakeAPICallArgsURLData<TURLData> {
  url: data.DataValidator<protocol.RuntimeOf<TURLData>, string>;
}

export interface MakeAPICallArgsQuery<
  THKTEncoded extends protocol.HKTEncoded,
  TQueryData,
> {
  query: data.DataValidator<
    protocol.RuntimeOf<TQueryData>,
    protocol.EncodedOf<THKTEncoded, TQueryData>
  >;
}

export interface MakeAPICallArgsBody<
  THKTEncoded extends protocol.HKTEncoded,
  TBodyData,
> {
  body: data.DataValidator<
    protocol.RuntimeOf<TBodyData>,
    protocol.EncodedOf<THKTEncoded, TBodyData>
  >;
}
