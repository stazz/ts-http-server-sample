import type * as ctx from "./context";
import type * as express from "express";
import type * as server from "../../core/server";
import * as state from "./state-internal";

export const getStateFromContext: server.GetStateFromContext<ctx.HKTContext> = (
  ctx,
) => state.doGetStateFromContext(ctx);

// This is meant to be used by middleware occurring before the actual REST API.
export const modifyState = <TState>(
  res: express.Response<unknown, TState>,
  modify: (state: TState) => void,
) => {
  modify(state.doGetStateFromRequest(res));
};
