// Lock in Express as HTTP server
import type * as server from "fastify";
import type * as moduleApi from "../../module-api/server";
import * as serverPlugin from "../../api/server/fastify";

export const setUsernameFromBasicAuth = (
  tryGetUsername: moduleApi.TryGetUsername,
): server.onRequestHookHandler => {
  const handler = asyncHandler(tryGetUsername);
  return (req, _, done) => {
    // At least typings for Fastify specify that handler must be void
    // This why we do this little dance around return type
    void handler(req, done);
  };
};

const asyncHandler =
  (tryGetUsername: moduleApi.TryGetUsername) =>
  async (req: server.FastifyRequest, done: server.HookHandlerDoneFunction) => {
    try {
      const username = await tryGetUsername(
        (headerName) => req.headers[headerName],
      );

      if (username) {
        const usernameConst = username;
        serverPlugin.modifyState<moduleApi.State>(
          req.raw,
          {},
          (state) => (state.username = usernameConst),
        );
      }
      done();
    } catch (e) {
      done(e instanceof Error ? e : new Error(`${e}`));
    }
  };
