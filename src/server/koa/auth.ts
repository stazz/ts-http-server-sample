import type * as server from "koa";
import type * as moduleApi from "../../module-api/server";
import * as serverPlugin from "../../api/server/koa";

export const setUsernameFromBasicAuth = (
  tryGetUsername: moduleApi.TryGetUsername,
): server.Middleware<moduleApi.State> => {
  return async (ctx, next) => {
    const username = await tryGetUsername((headerName) => ctx.get(headerName));
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
