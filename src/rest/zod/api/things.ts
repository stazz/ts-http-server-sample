// Zod as data runtime validator
import * as t from "zod";
// Import plugin for Zod
import * as tPlugin from "../../../api/data/zod";

// Import our REST-agnostic functionality
import * as functionality from "../../../lib";

import type * as types from "../types";
import type * as protocol from "../../../protocol";

export const getThings: types.EndpointSpec<
  protocol.APIGetThings,
  typeof functionality.queryThings
> = () => ({
  method: "GET",
  query: queryIncludeDeleted,
  endpointHandler: ({ query: { includeDeleted } }) =>
    functionality.queryThings(includeDeleted === true),
  output: tPlugin.outputValidator(t.array(t.unknown())),
  mdArgs: {
    openapi: {
      operation: { summary: "Query things" },
      urlParameters: undefined,
      queryParameters: {
        includeDeleted: {
          description: "Include deleted description",
        },
      },
      body: undefined,
      output: {
        description: "Output description",
        mediaTypes: {
          "application/json": {
            example: [],
          },
        },
      },
    },
  },
});

export const createThing: types.EndpointSpec<
  protocol.APICreateThing,
  typeof functionality.createThing
> = ({ idInBody, data: { thing } }) => ({
  method: "POST",
  input: tPlugin.inputValidator(thing),
  endpointHandler: ({ body }) => functionality.createThing(body.property),
  output: tPlugin.outputValidator(
    t.object({
      property: idInBody,
    }),
  ),
  mdArgs: {
    openapi: {
      operation: { summary: "Create a thing" },
      urlParameters: undefined,
      queryParameters: undefined,
      body: {
        "application/json": {
          example: {
            property: decodeOrThrow(
              idInBody,
              "00000000-0000-0000-0000-000000000000",
            ),
          },
        },
      },
      output: {
        description: "Output description",
        mediaTypes: {
          "application/json": {
            example: {
              property: decodeOrThrow(
                idInBody,
                "00000000-0000-0000-0000-000000000000",
              ),
            },
          },
        },
      },
    },
  },
});

export const getThing: types.EndpointSpec<
  protocol.APIGetThing,
  typeof functionality.queryThing
> = () => ({
  method: "GET",
  query: queryIncludeDeleted,
  endpointHandler: ({ url: { id }, query: { includeDeleted } }) =>
    functionality.queryThing(id, includeDeleted === true),
  output: tPlugin.outputValidator(t.string()),
  mdArgs: {
    openapi: {
      operation: { summary: "Query a thing" },
      urlParameters: {
        id: {
          description: "ID description",
        },
      },
      queryParameters: {
        includeDeleted: {
          description: "Include deleted description",
        },
      },
      body: undefined,
      output: {
        description: "Output description",
        mediaTypes: {
          "application/json": {
            example: "Example",
          },
        },
      },
    },
  },
});

export const connectThing: types.EndpointSpec<
  protocol.APIConnectThings,
  typeof functionality.connectToAnotherThing
> = ({ idInBody }) => ({
  method: "POST",
  input: tPlugin.inputValidator(
    t.object({
      anotherThingId: idInBody,
    }),
  ),
  endpointHandler: ({ url: { id }, body: { anotherThingId } }) =>
    functionality.connectToAnotherThing(id, anotherThingId),
  output: tPlugin.outputValidator(
    t.object({
      connected: t.boolean(),
      connectedAt: t.instanceof(Date),
    }),
    ({ connectedAt, ...rest }) => ({
      ...rest,
      connectedAt: connectedAt.toISOString(),
    }),
  ),
  mdArgs: {
    openapi: {
      operation: { summary: "Connect one thing to another" },
      urlParameters: {
        id: {
          description: "ID description",
        },
      },
      queryParameters: undefined,
      body: {
        "application/json": {
          example: {
            anotherThingId: decodeOrThrow(
              idInBody,
              "00000000-0000-0000-0000-000000000000",
            ),
          },
        },
      },
      output: {
        description: "Output description",
        mediaTypes: {
          "application/json": {
            example: {
              connected: true,
              connectedAt: new Date(0),
            },
          },
        },
      },
    },
  },
});

// Helpers
const queryIncludeDeleted = tPlugin.queryValidator({
  required: [],
  optional: ["includeDeleted"],
  validation: {
    includeDeleted: tPlugin.parameterBoolean(),
  },
});

const decodeOrThrow = <T>(validate: tPlugin.Decoder<T>, value: unknown) => {
  return validate.parse(value);
};
