import type * as express from "express";

export type Context<T> = {
  req: express.Request;
  res: express.Response<unknown, T>;
};
