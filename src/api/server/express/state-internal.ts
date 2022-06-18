import type * as ctx from "./context-types";
import type * as express from "express";

export const doGetStateFromContext = <T>({ res }: ctx.Context<T>) =>
  doGetStateFromRequest<T>(res);

export const doGetStateFromRequest = <T>(res: express.Response) =>
  res.locals as T;
