// IO-TS as data runtime validator
import * as t from "io-ts";
// Import plugin for IO-TS
import * as tPlugin from "../../api/data/io-ts";

// Import our REST-agnostic functionality
import * as functionality from "../../lib";

import type * as types from "./types";

export const accessSecret: types.EndpointWithStateNoURL<
  types.AuthenticatedState,
  "GET"
> = (provider) =>
  provider
    .forMethod("GET")
    .withoutBody(
      ({ state: { username } }) =>
        functionality.doAuthenticatedAction(username),
      tPlugin.outputValidator(t.void),
      {
        openapi: {
          urlParameters: undefined,
          queryParameters: undefined,
          body: undefined,
          operation: {},
          output: {
            description: "No data in output",
            mediaTypes: {
              "application/json": {},
            },
          },
        },
      },
    );
