import type * as server from "express";
import type * as serverCore from "express-serve-static-core";
import type * as moduleApi from "../../module-api/server";
import * as serverPlugin from "../../api/server/express";

export const setUsernameFromBasicAuth = (
  tryGetUsername: moduleApi.TryGetUsername,
): server.RequestHandler<
  serverCore.ParamsDictionary,
  unknown,
  unknown,
  serverCore.Query,
  moduleApi.State
> => {
  const handler = asyncHandler(tryGetUsername);
  return (req, res, next) => {
    // At least typings for ExpressJS specify that handler must be void
    // This why we do this little dance around return type
    void handler([req, res, next]);
  };
};

const asyncHandler =
  (tryGetUsername: moduleApi.TryGetUsername) =>
  async ([req, res, next]: Parameters<
    server.RequestHandler<
      serverCore.ParamsDictionary,
      unknown,
      unknown,
      serverCore.Query,
      moduleApi.State
    >
  >) => {
    try {
      const username = await tryGetUsername((headerName) =>
        req.get(headerName),
      );

      if (username) {
        const usernameConst = username;
        serverPlugin.modifyState(
          res,
          (state) => (state.username = usernameConst),
        );
      }
      next();
    } catch (e) {
      next(e);
    }
  };
