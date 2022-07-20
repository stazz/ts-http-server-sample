import type * as data from "../../core/data";
import * as t from "io-ts";
// import { PathReporter } from "io-ts/PathReporter";

export type ValidationError = t.Errors;

export const getHumanReadableErrorMessage = (error: ValidationError) =>
  failure(error).join("  \n");
// PathReporter.report({
//   _tag: "Left",
//   left: error,
// }).join("  \n");

export const createErrorObject = (
  errorInfo: ValidationError,
): data.DataValidatorResultError => ({
  error: "error",
  errorInfo,
  getHumanReadableMessage: () => getHumanReadableErrorMessage(errorInfo),
});

// Right now, doing this breaks at runtime:
// import { PathReporter } from "io-ts/PathReporter";
// With error:
// Error: Cannot find module '<base>/node_modules/io-ts/PathReporter' imported from <base>/src/api/data/io-ts/error.ts
// No time right now to figure out how to solve this, and as that was the only place causing this, as a emergency patch, I duplicate functionality of PathReporter here.
const failure = (errors: t.Errors) => errors.map(getMessage);
const getMessage = (e: t.ValidationError) =>
  e.message !== undefined
    ? e.message
    : `Invalid value ${stringify(e.value)} supplied to ${getContextPath(
        e.context,
      )}`;
const stringify = (v: unknown) => {
  if (typeof v === "function") {
    return t.getFunctionName(v);
  }
  if (typeof v === "number" && !isFinite(v)) {
    if (isNaN(v)) {
      return "NaN";
    }
    return v > 0 ? "Infinity" : "-Infinity";
  }
  return JSON.stringify(v);
};
const getContextPath = (context: t.Context) => {
  return context.map(({ key, type }) => `${key}: ${type.name}`).join("/");
};
