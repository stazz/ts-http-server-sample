import type * as ctx from "./context-types";
import type * as connect from "connect";

export const doGetStateFromContext = <T>(
  { req }: ctx.Context<T>,
  initialValue?: { value: T },
) => doGetStateFromRequest(req, initialValue);

export const doGetStateFromRequest = <T>(
  req: connect.IncomingMessage,
  initialValue: { value: T } | undefined,
) => {
  let state: T;
  if ("__tyrasState" in req) {
    state = (req as ctx.FastifyRequestWithState<T>).__tyrasState;
  } else {
    if (!initialValue) {
      throw new Error("State must be present in context");
    }
    state = initialValue.value;
    (req as ctx.FastifyRequestWithState<T>).__tyrasState = state;
  }
  return state;
};
