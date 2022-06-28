// IO-TS as data runtime validator
import * as t from "io-ts";
import * as tt from "io-ts-types";
// Import plugin for IO-TS
import * as tPlugin from "../../../api/data-server/io-ts";

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
  output: tPlugin.outputValidator(t.array(t.unknown)),
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
    // TODO fixme: we need to re-use thing here, but its encoder -function wants branded string.
    // For that, we probably need to overload tPlugin.outputValidator to accept 2nd argument, which would be transform.
    // In our case, it would be calling idInBody.decode for property.
    t.type({
      property: t.string,
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
              property: "00000000-0000-0000-0000-000000000000",
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
  output: tPlugin.outputValidator(t.string),
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
    t.type({
      anotherThingId: idInBody,
    }),
  ),
  endpointHandler: ({ url: { id }, body: { anotherThingId } }) =>
    functionality.connectToAnotherThing(id, anotherThingId),
  output: tPlugin.outputValidator(
    t.type({
      connected: t.boolean,
      connectedAt: tt.DateFromISOString,
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

// // Endpoint to get all things
// export const getThings: types.EndpointNoURL<"GET"> = (provider) =>
//   provider
//     .forMethod("GET", queryIncludeDeleted)
//     .withoutBody(
//       ({ query: { includeDeleted } }) =>
//         functionality.queryThings(includeDeleted === true),
//       tPlugin.outputValidator(t.array(t.unknown)),
//       {
//         openapi: {
//           operation: { summary: "Query things" },
//           urlParameters: undefined,
//           queryParameters: {
//             includeDeleted: {
//               description: "Include deleted description",
//             },
//           },
//           body: undefined,
//           output: {
//             description: "Output description",
//             mediaTypes: {
//               "application/json": {
//                 example: [],
//               },
//             },
//           },
//         },
//       },
//     );

// // Endpoint to create one thing
// export const createThing: types.EndpointNoURL<"POST"> = (
//   provider,
//   { idInBody },
// ) =>
//   provider.forMethod("POST").withBody(
//     // Body validator (will be called on JSON-parsed entity)
//     tPlugin.inputValidator(
//       t.type(
//         {
//           property: idInBody,
//         },
//         "CreateThingBody", // Friendly name for error messages
//       ),
//     ),
//     // Request handler
//     ({ body: { property } }) => functionality.createThing(property),
//     // Transform functionality output to REST output
//     tPlugin.outputValidator(
//       t.type(
//         {
//           property: t.string,
//         },
//         "CreateThingOutput", // Friendly name for error messages
//       ),
//     ),
//     // Metadata about endpoint (as dictated by "withMetadataProvider" above)
//     {
//       openapi: {
//         operation: { summary: "Create a thing" },
//         urlParameters: undefined,
//         body: {
//           "application/json": {
//             example: {
//               property: decodeOrThrow(
//                 idInBody,
//                 "00000000-0000-0000-0000-000000000000",
//               ),
//             },
//           },
//         },
//         queryParameters: undefined,
//         output: {
//           description: "Output description",
//           mediaTypes: {
//             "application/json": {
//               example: {
//                 property: "00000000-0000-0000-0000-000000000000",
//               },
//             },
//           },
//         },
//       },
//     },
//   );

// // Get thing
// export const getThing: types.Endpoint<{ id: string }, "GET"> = (provider) =>
//   provider.forMethod("GET", queryIncludeDeleted).withoutBody(
//     // Invoke functionality
//     ({ url: { id }, query: { includeDeleted } }) =>
//       functionality.queryThing(id, includeDeleted === true),
//     // Transform functionality output to REST output
//     tPlugin.outputValidator(t.string),
//     // Metadata about endpoint (as dictated by "withMetadataProvider" above)
//     {
//       openapi: {
//         operation: { summary: "Query a thing" },
//         urlParameters: {
//           id: {
//             description: "ID description",
//           },
//         },
//         queryParameters: {
//           includeDeleted: {
//             description: "Include deleted description",
//           },
//         },
//         body: undefined,
//         output: {
//           description: "Output description",
//           mediaTypes: {
//             "application/json": {
//               example: "Example",
//             },
//           },
//         },
//       },
//     },
//   );

// // Endpoint to connect two things
// export const connectThings: types.Endpoint<{ id: string }, "POST"> = (
//   provider,
//   { idInBody },
// ) =>
//   provider.forMethod("POST").withBody(
//     // Body validator (will be called on JSON-parsed entity)
//     tPlugin.inputValidator(
//       t.type(
//         {
//           anotherThingId: idInBody,
//         },
//         "ConnectThingBody", // Friendly name for error messages
//       ),
//     ),
//     ({ url: { id }, body: { anotherThingId } }) =>
//       functionality.connectToAnotherThing(id, anotherThingId),
//     // Transform functionality output to REST output
//     tPlugin.outputValidator(
//       t.type(
//         {
//           connected: t.boolean,
//           connectedAt: tt.DateFromISOString,
//         },
//         "ConnectThingOutput", // Friendly name for error messages
//       ),
//     ),
//     // Metadata about endpoint (as dictated by "withMetadataProvider" above)
//     {
//       openapi: {
//         operation: { summary: "Connect one thing to another" },
//         urlParameters: {
//           id: {
//             description: "ID description",
//           },
//         },
//         queryParameters: undefined,
//         body: {
//           "application/json": {
//             example: {
//               anotherThingId: decodeOrThrow(
//                 idInBody,
//                 "00000000-0000-0000-0000-000000000000",
//               ),
//             },
//           },
//         },
//         output: {
//           description: "Output description",
//           mediaTypes: {
//             "application/json": {
//               example: {
//                 connected: true,
//                 connectedAt: new Date(0),
//               },
//             },
//           },
//         },
//       },
//     },
//   );

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
