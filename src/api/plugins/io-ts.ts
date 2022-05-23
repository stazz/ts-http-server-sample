import * as model from "../model";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";

export type ValidationError = t.Errors;

export const validatorFromType =
  <T>(
    validation: (this: void, data: unknown) => t.Validation<T>,
  ): model.DataValidator<T, ValidationError> =>
  (body: unknown) => {
    const validationResult = validation(body);
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
