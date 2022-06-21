// Zod as data runtime validator
import * as t from "zod";
// Import plugin for Zod
import * as tPlugin from "../../../api/data/zod";

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
  output: tPlugin.outputValidator(t.undefined()),
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
