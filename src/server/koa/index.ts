// Lock in Koa as HTTP server
import Koa from "koa";
// Import plugin from generic REST-related things to Koa framework
import * as serverPlugin from "../../api/server/koa";

// This module will be dynamically loaded - agree on the shape of the module.
import type * as moduleApi from "../../module-api/server";

// Import auth middleware
import * as auth from "./auth";

import * as http from "http";

// This is RFC-adhering UUID regex. Relax if needed.
// Taken from https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
const uuidRegex =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const serverModule: moduleApi.ServerModule = {
  createServer: ({ createEndpoints, createEvents }) => {
    const { api } = createEndpoints(
      serverPlugin.getStateFromContext,
      serverPlugin.validateContextState,
      uuidRegex,
    );

    return http.createServer(
      new Koa()
        // First do auth (will modify context's state)
        .use(auth.setUsernameFromBasicAuth())
        // Then perform the REST API functionality
        .use(
          serverPlugin.createMiddleware(
            api,
            createEvents?.({
              getMethodAndUrl: (ctx) => ({
                method: ctx.method,
                url: ctx.originalUrl,
              }),
            }),
          ),
        )
        .callback(),
    );
  },
};

export default serverModule;
