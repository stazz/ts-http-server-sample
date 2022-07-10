// This file is not used by this sample
// It only exists to demonstrate how to use shared code in protocol.ts
// Notice that it doesn't use runtime validation - but one can build such on top of this simple sample.
// Also notice that URL building is now a bit duplicated. This is not optimal, and will be refactored to be DRY later.
import type * as protocol from "../protocol";
import * as data from "../api/core/data";

export const withDataValidation = <TError>(
  undefinedValidator: data.DataValidator<unknown, undefined, TError>,
): {
  withHeaders: <THeaders extends Record<string, HeaderProvider>>(
    headers: THeaders,
  ) => APICallFactory<keyof THeaders & string, TError>;
} => {
  return {
    withHeaders: (headers) => ({
      makeAPICall: <
        TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown>,
      >(
        methodValue: TProtocolSpec["method"],
        {
          method,
          response,
          url,
          ...rest
        }:
          | (MakeAPICallArgs<
              TProtocolSpec["method"],
              TProtocolSpec["responseBody"],
              TError
            > &
              (MakeAPICallArgsURL | MakeAPICallArgsURLData<unknown, TError>)) &
              // eslint-disable-next-line @typescript-eslint/ban-types
              (| {}
                | MakeAPICallArgsHeaders<Record<string, string>>
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
        if ("headers" in rest) {
          const missingHeaders = Object.values(rest.headers).filter(
            (headerFunctionality) => !(headerFunctionality in headers),
          );
          if (missingHeaders.length > 0) {
            throw new Error(
              `The endpoint requires the following header functionality, missing from given header functionality: ${missingHeaders.join(
                ", ",
              )}`,
            );
          }
        }

        const componentValidations = new data.ValidationChainer({
          url:
            typeof url === "string"
              ? data.transitiveDataValidation(
                  undefinedValidator,
                  () => ({ error: "none", data: url } as const),
                )
              : url,
        })
          .withInput(
            "query",
            "query" in rest
              ? (rest.query as data.DataValidator<
                  unknown,
                  Record<string, unknown>,
                  TError
                >)
              : undefined,
          )
          .withInput("body", "body" in rest ? rest.body : undefined);
        return async (args) => {
          const validatedArgs = componentValidations.getOutputs({
            ...(args ?? {}),
          });
          switch (validatedArgs.error) {
            case "none": {
              const httpArgs: HTTPInvocationArguments = {
                method: validatedMethod.data,
                ...validatedArgs.data,
              };
              if ("headers" in rest) {
                httpArgs.headers = Object.fromEntries(
                  await Promise.all(
                    Object.entries(rest.headers).map(
                      async ([headerName, headerFunctionalityID]) =>
                        [
                          headerName,
                          await headers[headerFunctionalityID]({
                            ...httpArgs,
                            headerName,
                          }),
                        ] as const,
                    ),
                  ),
                );
              }
              return response(await someMethodToInvokeHTTPEndpoint(httpArgs));
            }
            default:
              return {
                error: "error-input",
                errorInfo: validatedArgs.errorInfo,
              };
          }
        };
      },
    }),
  };
};

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
  args: protocol.GetRuntime<TArgs>,
) => Promise<
  | data.DataValidatorResult<protocol.GetRuntime<TReturnType>, TError>
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
  response: data.DataValidator<unknown, protocol.GetRuntime<TResponse>, TError>;
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
  url: data.DataValidator<protocol.GetRuntime<TURLData>, string, TError>;
}

export interface MakeAPICallArgsQuery<TQueryData, TError> {
  query: data.DataValidator<
    protocol.GetRuntime<TQueryData>,
    protocol.GetEncoded<TQueryData>,
    TError
  >;
}

export interface MakeAPICallArgsBody<TBodyData, TError> {
  body: data.DataValidator<
    protocol.GetRuntime<TBodyData>,
    protocol.GetEncoded<TBodyData>,
    TError
  >;
}

export type HeaderProvider = (
  args: Omit<HTTPInvocationArguments, "headers"> & { headerName: string },
) => string | PromiseLike<string>;

export interface HTTPInvocationArguments {
  method: string;
  url: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

const someMethodToInvokeHTTPEndpoint = ({
  method,
  url,
  query,
  body,
  headers,
}: HTTPInvocationArguments): Promise<unknown> => {
  throw new Error(
    "This exists only to simulate signature of some way of invoking HTTP endpoint in the client.",
  );
};
