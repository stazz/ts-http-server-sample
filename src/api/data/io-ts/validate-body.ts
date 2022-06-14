import * as core from "../../core/core";
import type * as error from "./error";
import * as validate from "./validate";
import * as utils from "./utils";
import * as rawbody from "raw-body";

// We only support json things for io-ts validation.
const CONTENT_TYPE = "application/json" as const;

export const inputValidator = <T>(
  validation: validate.Decoder<T>,
  strictContentType = false,
  opts?: rawbody.Options,
): core.DataValidatorRequestInputSpec<
  T,
  error.ValidationError,
  ValidatorSpec
> => {
  const jsonValidation = core.transitiveDataValidation(
    (inputString: string) => {
      if (inputString.length > 0) {
        try {
          return {
            error: "none",
            data: JSON.parse(inputString) as unknown,
          };
        } catch (e) {
          return {
            error: "error",
            errorInfo: utils.exceptionAsValidationError(inputString, e),
          };
        }
      } else {
        // No body supplied -> appear as undefined
        return {
          error: "none",
          data: undefined,
        };
      }
    },
    validate.plainValidator(validation),
  );

  return {
    validator: async ({ contentType, input }) => {
      return contentType.startsWith(CONTENT_TYPE) ||
        (!strictContentType && contentType.length === 0)
        ? // stream._decoder || (state && (state.encoding || state.decoder))
          jsonValidation(
            await rawbody.default(input, {
              ...(opts ?? {}),
              // TODO get encoding from headers (or perhaps content type value? e.g. application/json;encoding=utf8)
              encoding: opts?.encoding ?? "utf8",
            }),
          )
        : {
            error: "unsupported-content-type",
            supportedContentTypes: [CONTENT_TYPE],
          };
    },
    validatorSpec: { [CONTENT_TYPE]: validation },
  };
};

export const outputValidator = <TOutput, TSerialized>(
  validation: validate.Encoder<TOutput, TSerialized>,
): core.DataValidatorResponseOutputSpec<
  TOutput,
  error.ValidationError,
  OutputValidatorSpec
> => ({
  validator: (output) => {
    try {
      return {
        error: "none",
        data: {
          contentType: CONTENT_TYPE,
          output: JSON.stringify(validation.encode(output)),
        },
      };
    } catch (e) {
      return {
        error: "error",
        errorInfo: utils.exceptionAsValidationError(output, e),
      };
    }
  },
  validatorSpec: {
    [CONTENT_TYPE]: validation,
  },
});

export type ValidatorSpec = {
  [CONTENT_TYPE]: validate.Decoder<unknown>;
};

export type OutputValidatorSpec = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [CONTENT_TYPE]: validate.Encoder<any, unknown>;
};
