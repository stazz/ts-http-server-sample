// This file is not used by this sample
// It only exists to demonstrate how to use shared code in protocol.ts
// Notice that it doesn't use runtime validation - but one can build such on top of this simple sample.
// Also notice that URL building is now a bit duplicated. This is not optimal, and will be refactored to be DRY later.
import type * as protocol from "../protocol";
import * as data from "../api/core/data";

export const bindErrorType = <TError>(): APICallFactory<TError> => {
  return {
    makeAPICall: <
      TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown>,
    >(
      methodValue: TProtocolSpec["method"],
      {
        method,
        response,
        ...rest
      }: MakeAPICallArgs<
        TProtocolSpec["method"],
        TProtocolSpec["responseBody"],
        TError
      > &
        // eslint-disable-next-line @typescript-eslint/ban-types
        (| {}
          | MakeAPICallArgsURL<unknown, TError>
          | MakeAPICallArgsQuery<Record<string, unknown>, TError>
          | MakeAPICallArgsBody<unknown, TError>
        ),
    ): APICall<
      Partial<Record<"method" | "url" | "query" | "body", unknown>> | void,
      TProtocolSpec["responseBody"],
      TError
    > => {
      const validatedMethod = method(methodValue);
      if (validatedMethod.error !== "none") {
        throw new Error(
          `Invalid method: ${JSON.stringify(validatedMethod.errorInfo)}`,
        );
      }

      const componentValidations = new data.ValidationChainer({})
        .withInput("url", "url" in rest ? rest.url : undefined)
        .withInput("query", "query" in rest ? rest.query : undefined)
        .withInput("body", "body" in rest ? rest.body : undefined);
      return async (args) => {
        const validatedArgs = componentValidations.getOutputs({
          ...(args ?? {}),
        });
        return validatedArgs.error === "none"
          ? response(
              await someMethodToInvokeHTTPEndpoint({
                method: validatedMethod.data,
                ...validatedArgs.data,
              }),
            )
          : {
              error: "error-input",
              errorInfo: validatedArgs.errorInfo,
            };
      };
    },
  };
};

// These overloads are a bit fugly but oh well...
export interface APICallFactory<TError> {
  // Overload for 1-form
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> & {
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
    >,
  ): APICall<void, TProtocolSpec["responseBody"], TError>;

  // Overloads for 2-forms
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
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
      MakeAPICallArgsQuery<TProtocolSpec["query"], TError>,
  ): APICall<
    { query: TProtocolSpec["query"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
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
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
    { body: TProtocolSpec["requestBody"] },
    TProtocolSpec["responseBody"],
    TError
  >;
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
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
      MakeAPICallArgsURL<TProtocolSpec["url"], TError>,
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
        [P in keyof protocol.ProtocolSpecURL<Record<string, unknown>>]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
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
        [P in keyof protocol.ProtocolSpecRequestBody<unknown>]?: never;
      },
  >(
    method: TProtocolSpec["method"],
    args: MakeAPICallArgs<
      TProtocolSpec["method"],
      TProtocolSpec["responseBody"],
      TError
    > &
      MakeAPICallArgsURL<TProtocolSpec["url"], TError> &
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
      MakeAPICallArgsURL<TProtocolSpec["url"], TError> &
      MakeAPICallArgsBody<TProtocolSpec["requestBody"], TError>,
  ): APICall<
    { body: TProtocolSpec["requestBody"]; url: TProtocolSpec["url"] },
    TProtocolSpec["responseBody"],
    TError
  >;

  // Overload for 4-form
  makeAPICall<
    TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
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
      MakeAPICallArgsURL<TProtocolSpec["url"], TError> &
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

export type APICall<TArgs, TReturnType, TError> = (args: TArgs) => Promise<
  | data.DataValidatorResult<TReturnType, TError>
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
  response: data.DataValidator<unknown, TResponse, TError>;
}

export interface MakeAPICallArgsURL<TURLData, TError> {
  url: (urlParams: TURLData) => data.DataValidatorResult<string, TError>;
}

export interface MakeAPICallArgsQuery<TQueryData, TError> {
  query: data.DataValidator<unknown, TQueryData, TError>;
}

export interface MakeAPICallArgsBody<TBodyData, TError> {
  body: data.DataValidator<unknown, TBodyData, TError>;
}

const someMethodToInvokeHTTPEndpoint = (args: {
  method: string;
  url: string;
  query?: Record<string, unknown>;
  body?: unknown;
}): Promise<unknown> => {
  throw new Error(
    "This exists only to simulate signature of some way of invoking HTTP endpoint in the client.",
  );
};
