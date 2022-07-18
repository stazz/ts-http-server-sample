// Lock in Fastify as HTTP server
import * as server from "fastify";
// Import plugin from generic REST-related things to Fastify framework
import * as serverPlugin from "../../api/server/fastify";

// This module will be dynamically loaded - agree on the shape of the module.
import type * as moduleApi from "../../module-api/server";

// Import auth middleware
import * as auth from "./auth";

// This is RFC-adhering UUID regex. Relax if needed.
// Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
const uuidRegex =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const serverModule: moduleApi.ServerModule = {
  createServer: ({ createEndpoints, createEvents }) => {
    const { api, getHumanReadableErrorMessage } = createEndpoints(
      serverPlugin.getStateFromContext,
      serverPlugin.validateContextState,
      uuidRegex,
    );
    const performFunctionality = serverPlugin.createRoute(
      api,
      {},
      createEvents?.({
        getHumanReadableErrorMessage,
        getMethodAndUrl: ({ req }) => ({
          method: req.method ?? "<no method>",
          url: req.originalUrl ?? req.url ?? "<no url>",
        }),
      }),
    );

    // Create Fastify app
    const instance = server
      .default
      //{ logger: { level: "info" } }
      ();
    // Register the functionality callback, and also remember the handler to set username from auth
    serverPlugin.registerRouteToFastifyInstance(
      instance,
      performFunctionality,
      {
        onRequest: auth.setUsernameFromBasicAuth(),
      },
    );

    return {
      server: instance.server,
      // Using listen on returned "server" object causes internal Fastify errors
      // So pass on custom listen callback.
      customListen: (port, host) =>
        instance
          // Start on given port
          .listen({
            port,
            host,
          }),
    };
  },
};

export default serverModule;
