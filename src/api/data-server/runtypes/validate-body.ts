import * as data from "../../core/data-server";
import * as t from "runtypes";
import * as common from "../../data/runtypes";
import * as rawbody from "raw-body";

// We only support json things for io-ts validation.
export const CONTENT_TYPE = "application/json" as const;

export const inputValidator = <T>(
  validation: common.Decoder<T>,
  strictContentType = false,
  opts?: rawbody.Options,
): data.DataValidatorRequestInputSpec<T, InputValidatorSpec<T>> => {
  const jsonValidation = data.transitiveDataValidation(
    (inputString: string) => {
      if (inputString.length > 0) {
        try {
          return {
            error: "none",
            data: JSON.parse(inputString) as unknown,
          };
        } catch (e) {
          return data.exceptionAsValidationError(e);
        }
      } else {
        // No body supplied -> appear as undefined
        return {
          error: "none",
          data: undefined,
        };
      }
    },
    common.plainValidator(validation),
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
  headers?: Record<string, string>,
): data.DataValidatorResponseOutputSpec<
  TOutput,
  OutputValidatorSpec<TOutput, TOutput>
>;
export function outputValidator<TOutput, TSerialized>(
  validation: t.Runtype<TOutput>,
  transform: (output: TOutput) => TSerialized,
  headers?: Record<string, string>,
): data.DataValidatorResponseOutputSpec<
  TOutput,
  OutputValidatorSpec<TOutput, TSerialized>
>;
export function outputValidator<TOutput, TSerialized>(
  validation: t.Runtype<TOutput>,
  transformOrHeaders?:
    | ((output: TOutput) => TSerialized)
    | Record<string, string>,
  maybeHeaders?: Record<string, string>,
): data.DataValidatorResponseOutputSpec<
  TOutput,
  OutputValidatorSpec<TOutput, TSerialized>
> {
  const headers =
    typeof transformOrHeaders === "function"
      ? maybeHeaders
      : transformOrHeaders;
  const transform =
    typeof transformOrHeaders === "function" ? transformOrHeaders : undefined;
  const encoder: common.Encoder<TOutput, TSerialized> = transform
    ? common.encoder(validation, transform)
    : (common.encoder(validation) as unknown as common.Encoder<
        TOutput,
        TSerialized
      >);
  return {
    validator: (output) => {
      try {
        const result = encoder.validation.validate(output);
        if (result.success) {
          const success: data.DataValidatorResponseOutputSuccess = {
            contentType: CONTENT_TYPE,
            output: JSON.stringify(encoder.transform(result.value)),
          };
          if (headers) {
            success.headers = headers;
          }
          return {
            error: "none",
            data: success,
          };
        } else {
          return common.createErrorObject([data.omit(result, "success")]);
        }
      } catch (e) {
        return data.exceptionAsValidationError(e);
      }
    },
    validatorSpec: {
      headerSpec: headers ?? {},
      contents: {
        [CONTENT_TYPE]: encoder,
      },
    },
  };
}

export type InputValidatorSpec<TData> = {
  [CONTENT_TYPE]: common.Decoder<TData>;
};

export type OutputValidatorSpec<TOutput, TSerialized> = {
  [CONTENT_TYPE]: common.Encoder<TOutput, TSerialized>;
};
