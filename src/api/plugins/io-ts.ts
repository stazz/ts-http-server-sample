import * as model from "../model";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";

export type ValidationError = t.Errors;

export const inputValidator =
  <T>(
    validation: t.Decoder<unknown, T>,
  ): model.DataValidatorInput<T, ValidationError> =>
  (body) => {
    const validationResult = validation.decode(body);
    return validationResult._tag === "Right"
      ? {
          error: "in-none",
          data: validationResult.right,
        }
      : {
          error: "in-error",
          errorInfo: validationResult.left,
        };
  };

export const outputValidator =
  <TOutput, TSerialized>(
    validation: t.Encoder<TOutput, TSerialized>,
  ): model.DataValidatorOutput<TSerialized, ValidationError, TOutput> =>
  (output) => {
    try {
      return {
        error: "out-none",
        data: validation.encode(output),
      };
    } catch (e) {
      return {
        error: "out-error",
        errorInfo: [
          {
            value: output,
            message: `${e}`,
            context: [],
          },
        ],
      };
    }
  };

export const getHumanReadableErrorMessage = (error: ValidationError) =>
  PathReporter.report({
    _tag: "Left",
    left: error,
  }).join("\n");
