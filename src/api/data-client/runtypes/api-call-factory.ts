import type * as protocol from "../../core/protocol";
import * as data from "../../core/data";
import type * as tPlugin from "../../data/runtypes";

// These 16 overloads are a bit fugly but oh well...
export interface APICallFactory<THeaders extends string, TError> {
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
  ): APICall<void, TProtocolSpec["responseBody"], TError>;

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
  ): APICall<void, TProtocolSpec["responseBody"], TError>;

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
      MakeAPICallArgsQuery<TProtocolSpec["query"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<TProtocolSpec["query"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURL &
      MakeAPICallArgsQuery<TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<TProtocolSpec["query"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<TProtocolSpec["query"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
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
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsHeaders<TProtocolSpec["headers"]> &
      MakeAPICallArgsURLData<TProtocolSpec["url"], TError> &
      MakeAPICallArgsQuery<TProtocolSpec["query"], TError> &
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
    {
      query: TProtocolSpec["query"];
      body: TProtocolSpec["requestBody"];
      url: TProtocolSpec["url"];
    },
    TProtocolSpec["responseBody"],
    TError
  >;
}

export type APICall<TArgs, TReturnType, TError> = (
  args: tPlugin.GetRuntime<TArgs>,
) => Promise<
  | data.DataValidatorResult<tPlugin.GetRuntime<TReturnType>, TError>
  | {
      error: "error-input";
      errorInfo: Partial<{
        [P in "method" | "url" | "query" | "body"]: data.GetError<
          data.DataValidatorResultError<TError>
        >;
      }>;
    }
>;

export interface MakeAPICallArgs<TMethod, TResponse, TError> {
  method: data.DataValidator<unknown, TMethod, TError>;
  response: data.DataValidator<unknown, tPlugin.GetRuntime<TResponse>, TError>;
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
  url: data.DataValidator<tPlugin.GetRuntime<TURLData>, string, TError>;
}

export interface MakeAPICallArgsQuery<TQueryData, TError> {
  query: data.DataValidator<
    tPlugin.GetRuntime<TQueryData>,
    tPlugin.GetEncoded<TQueryData>,
    TError
  >;
}

export interface MakeAPICallArgsBody<TBodyData, TError> {
  body: data.DataValidator<
    tPlugin.GetRuntime<TBodyData>,
    tPlugin.GetEncoded<TBodyData>,
    TError
  >;
}
