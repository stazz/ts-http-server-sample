import * as t from "runtypes";

export type ValidationError = Array<Omit<t.Failure, "success">>;

export const getHumanReadableErrorMessage = (errors: ValidationError) =>
  errors
    .map(
      ({ code, message, details }) =>
        `${code}: ${message}.${
          details === undefined ? "" : `\n  ${detailsToString(details)}`
        }`,
    )
    .join(`\n`);

const detailsToString = (details: string | t.Details): string =>
  typeof details === "string"
    ? details
    : (Array.isArray(details)
        ? details.map(detailsToString)
        : Object.entries(details).map(
            ([key, detail]) => `${key}:${detailsToString(detail)}`,
          )
      ).join("\n  ");
