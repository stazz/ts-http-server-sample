import type * as connect from "connect";
import type * as http from "http";

export type Context<T> = {
  req: FastifyRequestWithState<T>;
  res: http.ServerResponse;
};
export type FastifyRequestWithState<T> = connect.IncomingMessage & {
  __tyrasState: T;
};
