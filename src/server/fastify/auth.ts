// Lock in Express as HTTP server
import type * as server from "fastify";
import type * as moduleApi from "../../module-server";
import * as serverPlugin from "../../api/server/fastify";

export const setUsernameFromBasicAuth = (): server.onRequestHookHandler => {
  return (req, res, done) => {
    const auth = req.headers["authorization"] ?? "";
    const scheme = auth.substring(0, 6).toLowerCase();
    let username: string | undefined;
    if (scheme.startsWith("basic ")) {
      try {
        const authData = Buffer.from(
          auth.substring(scheme.length),
          "base64",
        ).toString();
        const idx = authData.indexOf(":");
        if (idx > 0) {
          // Hardcoded creds, just because of sample
          if (
            authData.substring(0, idx) === "secret" &&
            authData.substring(idx + 1) === "secret"
          ) {
            username = authData.substring(0, idx);
          }
        }
      } catch {
        // Ignore, will return 403
      }
    }
    if (username) {
      const usernameConst = username;
      serverPlugin.modifyState<moduleApi.State>(
        req.raw,
        {},
        (state) => (state.username = usernameConst),
      );
    }
    done();
  };
};
