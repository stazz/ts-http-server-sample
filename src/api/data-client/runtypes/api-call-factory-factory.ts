import type * as protocol from "../../core/protocol";
import * as data from "../../core/data";
import * as tPlugin from "../../data/runtypes";
import type * as common from "../common";
import type * as apiCall from "./api-call-factory";
import * as t from "runtypes";

export const createAPICallFactory = (
  callHttpEndpoint: common.CallHTTPEndpoint,
): {
  withHeaders: <THeaders extends Record<string, common.HeaderProvider>>(
    headers: THeaders,
  ) => apiCall.APICallFactory<keyof THeaders & string, tPlugin.ValidationError>;
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
          | (apiCall.MakeAPICallArgs<
              TProtocolSpec["method"],
              TProtocolSpec["responseBody"],
              tPlugin.ValidationError
            > &
              (
                | apiCall.MakeAPICallArgsURL
                | apiCall.MakeAPICallArgsURLData<
                    unknown,
                    tPlugin.ValidationError
                  >
              )) &
              // eslint-disable-next-line @typescript-eslint/ban-types
              (| {}
                | apiCall.MakeAPICallArgsHeaders<Record<string, string>>
                | apiCall.MakeAPICallArgsQuery<
                    Record<string, unknown>,
                    tPlugin.ValidationError
                  >
                | apiCall.MakeAPICallArgsBody<unknown, tPlugin.ValidationError>
              ),
      ): apiCall.APICall<
        Partial<Record<"method" | "url" | "query" | "body", unknown>> | void,
        TProtocolSpec["responseBody"],
        tPlugin.ValidationError
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
                  tPlugin.ValidationError
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
              const httpArgs: common.HTTPInvocationArguments = {
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
  };
};

const undefinedValidator = tPlugin.plainValidator(t.Undefined);
