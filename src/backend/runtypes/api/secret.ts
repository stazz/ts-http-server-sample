// Runtypes as data runtime validator
import * as t from "runtypes";
// Import plugin for Runtypes
import * as tPlugin from "../../../api/data-server/runtypes";

// Import our REST-agnostic functionality
import * as functionality from "../../../lib";

import type * as types from "../types";
import type * as protocol from "../../../protocol";

export const accessSecret: types.EndpointSpec<
  protocol.APIAuthenticated,
  typeof functionality.doAuthenticatedAction,
  types.AuthenticatedState
> = () => ({
  method: "GET",
  endpointHandler: ({ state: { username } }) =>
    functionality.doAuthenticatedAction(username),
  output: tPlugin.outputValidator(t.Undefined),
  mdArgs: {
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
});
