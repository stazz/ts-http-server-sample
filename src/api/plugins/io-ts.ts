import * as model from "../model";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import * as rawbody from "raw-body";

export type ValidationError = t.Errors;

export const queryValidator = <T>(
  validation: t.Decoder<unknown, T> & { _tag: string },
): model.QueryValidatorSpec<T, ValidationError> => ({
  validator: {
    query: "object",
    validator: plainValidator(validation),
  },
});

// We only support json things for io-ts validation.
const CONTENT_TYPE = "application/json" as const;

export const inputValidator = <T>(
  validation: t.Decoder<unknown, T> & { _tag: string },
  strictContentType = false,
): model.DataValidatorRequestInputSpec<T, ValidationError> => {
  const jsonValidation = model.transitiveDataValidation(
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
            errorInfo: exceptionAsValidationError(inputString, e),
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
    plainValidator(validation),
  );

  return {
    validator: async ({ contentType, input }) => {
      return contentType.startsWith(CONTENT_TYPE) ||
        (!strictContentType && contentType.length === 0)
        ? jsonValidation(await rawbody.default(input, { encoding: "utf8" }))
        : {
            error: "unsupported-content-type",
            supportedContentTypes: [CONTENT_TYPE],
          };
    },
  };
};

export const outputValidator = <TOutput, TSerialized>(
  validation: t.Encoder<TOutput, TSerialized> & { _tag: string },
): model.DataValidatorResponseOutputSpec<TOutput, ValidationError> => ({
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
        errorInfo: exceptionAsValidationError(output, e),
      };
    }
  },
});

export const plainValidator =
  <TInput, TData>(
    validation: t.Decoder<TInput, TData> & { _tag: string },
  ): model.DataValidator<TInput, TData, ValidationError> =>
  (input) => {
    const validationResult = validation.decode(input);
    return validationResult._tag === "Right"
      ? {
          error: "none",
          data: validationResult.right,
        }
      : {
          error: "error",
          errorInfo: validationResult.left,
        };
  };

export const getHumanReadableErrorMessage = (error: ValidationError) =>
  PathReporter.report({
    _tag: "Left",
    left: error,
  }).join("\n");

const exceptionAsValidationError = (
  input: unknown,
  exception: unknown,
): ValidationError => [
  {
    value: input,
    message: `${exception}`,
    context: [],
  },
];
