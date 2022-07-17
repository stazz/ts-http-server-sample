import type * as protocol from "../../core/protocol";
import * as data from "../../core/data";
import type * as apiCall from "./api-call";
import type * as apiCallFactory from "./api-call-factory";

export const createAPICallFactory = <THKTEncoded extends protocol.HKTEncoded>(
  callHttpEndpoint: CallHTTPEndpoint,
): {
  withUndefinedValidator: <TValidationError>(
    undefinedValidator: data.DataValidator<
      unknown,
      undefined,
      TValidationError
    >,
  ) => {
    withHeaders: <THeaders extends Record<string, HeaderProvider>>(
      headers: THeaders,
    ) => apiCallFactory.APICallFactory<
      THKTEncoded,
      keyof THeaders & string,
      TValidationError
    >;
  };
} => {
  return {
    withUndefinedValidator: (undefinedValidator) => ({
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
            | (apiCallFactory.MakeAPICallArgs<
                TProtocolSpec["method"],
                TProtocolSpec["responseBody"],
                DataValidatorError<typeof undefinedValidator>
              > &
                (
                  | apiCallFactory.MakeAPICallArgsURL
                  | apiCallFactory.MakeAPICallArgsURLData<
                      unknown,
                      DataValidatorError<typeof undefinedValidator>
                    >
                )) &
                // eslint-disable-next-line @typescript-eslint/ban-types
                (| {}
                  | apiCallFactory.MakeAPICallArgsHeaders<
                      Record<string, string>
                    >
                  | apiCallFactory.MakeAPICallArgsQuery<
                      THKTEncoded,
                      Record<string, unknown>,
                      DataValidatorError<typeof undefinedValidator>
                    >
                  | apiCallFactory.MakeAPICallArgsBody<
                      THKTEncoded,
                      unknown,
                      DataValidatorError<typeof undefinedValidator>
                    >
                ),
        ): apiCall.APICall<
          Partial<Record<"method" | "url" | "query" | "body", unknown>> | void,
          TProtocolSpec["responseBody"],
          DataValidatorError<typeof undefinedValidator>
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
                    DataValidatorError<typeof undefinedValidator>
                  >)
                : undefined,
            )
            .withInput("body", "body" in rest ? rest.body : undefined);
          return async (args) => {
            const validatedArgs = componentValidations.getOutputs({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(args ?? {}),
              url: args ? args.url : undefined,
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
                return response(await callHttpEndpoint(httpArgs));
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
    }),
  };
};

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

export type CallHTTPEndpoint = (
  args: HTTPInvocationArguments,
) => Promise<unknown>;

type DataValidatorError<T> = T extends data.DataValidator<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _1,
  infer TError
>
  ? TError
  : never;
