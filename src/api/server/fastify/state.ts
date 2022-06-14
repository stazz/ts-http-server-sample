import type * as ctx from "./context-types";
import type * as connect from "connect";
import * as state from "./state-internal";

export const getStateFromContext = <T>(ctx: ctx.Context<T>) =>
  state.doGetStateFromContext(ctx);

export const modifyState = <TState>(
  req: connect.IncomingMessage,
  initialValue: TState,
  modify: (state: TState) => void,
) => {
  modify(state.doGetStateFromRequest(req, { value: initialValue }));
};
