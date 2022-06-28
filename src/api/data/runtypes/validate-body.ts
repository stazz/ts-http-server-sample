import * as data from "../../core/data";
import * as t from "runtypes";
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
): data.DataValidatorRequestInputSpec<
  T,
  error.ValidationError,
  InputValidatorSpec<T>
> => {
  const jsonValidation = data.transitiveDataValidation(
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

export function outputValidator<TOutput>(
  validation: t.Runtype<TOutput>,
): data.DataValidatorResponseOutputSpec<
  TOutput,
  error.ValidationError,
  OutputValidatorSpec<TOutput, TOutput>
>;
export function outputValidator<TOutput, TSerialized>(
  validation: t.Runtype<TOutput>,
  transform: (output: TOutput) => TSerialized,
): data.DataValidatorResponseOutputSpec<
  TOutput,
  error.ValidationError,
  OutputValidatorSpec<TOutput, TSerialized>
>;
export function outputValidator<TOutput, TSerialized>(
  validation: t.Runtype<TOutput>,
  transform?: (output: TOutput) => TSerialized,
): data.DataValidatorResponseOutputSpec<
  TOutput,
  error.ValidationError,
  OutputValidatorSpec<TOutput, TSerialized>
> {
  const encoder: validate.Encoder<TOutput, TSerialized> = transform
    ? validate.encoder(validation, transform)
    : (validate.encoder(validation) as unknown as validate.Encoder<
        TOutput,
        TSerialized
      >);
  return {
    validator: (output) => {
      try {
        const result = encoder.validation.validate(output);
        return result.success
          ? {
              error: "none",
              data: {
                contentType: CONTENT_TYPE,
                output: JSON.stringify(encoder.transform(result.value)),
              },
            }
          : {
              error: "error",
              errorInfo: [data.omit(result, "success")],
            };
      } catch (e) {
        return {
          error: "error",
          errorInfo: utils.exceptionAsValidationError(output, e),
        };
      }
    },
    validatorSpec: {
      [CONTENT_TYPE]: encoder,
    },
  };
}

export type InputValidatorSpec<TData> = {
  [CONTENT_TYPE]: validate.Decoder<TData>;
};

export type OutputValidatorSpec<TOutput, TSerialized> = {
  [CONTENT_TYPE]: validate.Encoder<TOutput, TSerialized>;
};
