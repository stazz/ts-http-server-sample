import type * as server from "koa";
import type * as moduleApi from "../../module-api/server";
import * as serverPlugin from "../../api/server/koa";

export const setUsernameFromBasicAuth =
  (): server.Middleware<moduleApi.State> => {
    return async (ctx, next) => {
      const auth = ctx.get("authorization");
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
        serverPlugin.modifyState(
          ctx,
          (state) => (state.username = usernameConst),
        );
      }
      await next();
    };
  };
