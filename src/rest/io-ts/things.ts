// IO-TS as data runtime validator
import * as t from "io-ts";
import * as tt from "io-ts-types";
// Import plugin for IO-TS
import * as tPlugin from "../../api/data/io-ts";

// Import our REST-agnostic functionality
import * as functionality from "../../lib";

import type * as types from "./types";

// There are two endpoints at same URL -> make that invocation easier in index.ts by exposing this method
export const getThingsOrCreateThing: types.EndpointNoURL<"GET" | "POST"> = (
  provider,
  args,
) => createThing(getThings(provider, args), args);

// Endpoint to get all things
export const getThings: types.EndpointNoURL<"GET"> = (provider) =>
  provider
    .forMethod("GET", queryIncludeDeleted)
    .withoutBody(
      ({ query: { includeDeleted } }) =>
        functionality.queryThings(includeDeleted === true),
      tPlugin.outputValidator(t.array(t.unknown)),
      {
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
    );

// Endpoint to create one thing
export const createThing: types.EndpointNoURL<"POST"> = (
  provider,
  { idInBody },
) =>
  provider.forMethod("POST").withBody(
    // Body validator (will be called on JSON-parsed entity)
    tPlugin.inputValidator(
      t.type(
        {
          property: idInBody,
        },
        "CreateThingBody", // Friendly name for error messages
      ),
    ),
    // Request handler
    ({ body: { property } }) => functionality.createThing(property),
    // Transform functionality output to REST output
    tPlugin.outputValidator(
      t.type(
        {
          property: t.string,
        },
        "CreateThingOutput", // Friendly name for error messages
      ),
    ),
    // Metadata about endpoint (as dictated by "withMetadataProvider" above)
    {
      openapi: {
        operation: { summary: "Create a thing" },
        urlParameters: undefined,
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
        queryParameters: undefined,
        output: {
          description: "Output description",
          mediaTypes: {
            "application/json": {
              example: {
                property: "00000000-0000-0000-0000-000000000000",
              },
            },
          },
        },
      },
    },
  );

// Get thing
export const getThing: types.Endpoint<{ id: string }, "GET"> = (provider) =>
  provider.forMethod("GET", queryIncludeDeleted).withoutBody(
    // Invoke functionality
    ({ url: { id }, query: { includeDeleted } }) =>
      functionality.queryThing(id, includeDeleted === true),
    // Transform functionality output to REST output
    tPlugin.outputValidator(t.string),
    // Metadata about endpoint (as dictated by "withMetadataProvider" above)
    {
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
  );

// Endpoint to connect two things
export const connectThings: types.Endpoint<{ id: string }, "POST"> = (
  provider,
  { idInBody },
) =>
  provider.forMethod("POST").withBody(
    // Body validator (will be called on JSON-parsed entity)
    tPlugin.inputValidator(
      t.type(
        {
          anotherThingId: idInBody,
        },
        "ConnectThingBody", // Friendly name for error messages
      ),
    ),
    ({ url: { id }, body: { anotherThingId } }) =>
      functionality.connectToAnotherThing(id, anotherThingId),
    // Transform functionality output to REST output
    tPlugin.outputValidator(
      t.type(
        {
          connected: t.boolean,
          connectedAt: tt.DateFromISOString,
        },
        "ConnectThingOutput", // Friendly name for error messages
      ),
    ),
    // Metadata about endpoint (as dictated by "withMetadataProvider" above)
    {
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
  );

// Helpers
const queryIncludeDeleted = tPlugin.queryValidator({
  required: [],
  optional: ["includeDeleted"],
  validation: {
    includeDeleted: tPlugin.parameterBoolean(),
  },
});

const decodeOrThrow = <T>(validate: tPlugin.Decoder<T>, value: unknown) => {
  const result = validate.decode(value);
  if (result._tag === "Left") {
    throw new Error("Fail");
  }
  return result.right;
};
