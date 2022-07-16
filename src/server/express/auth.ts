import type * as server from "express";
import type * as serverCore from "express-serve-static-core";
import type * as moduleApi from "../../module-api/server";
import * as serverPlugin from "../../api/server/express";

export const setUsernameFromBasicAuth = (): server.RequestHandler<
  serverCore.ParamsDictionary,
  unknown,
  unknown,
  serverCore.Query,
  moduleApi.State
> => {
  return (req, res, next) => {
    const auth = req.get("authorization") ?? "";
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
        res,
        (state) => (state.username = usernameConst),
      );
    }
    next();
  };
};
