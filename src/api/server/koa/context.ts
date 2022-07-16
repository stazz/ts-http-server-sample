import * as server from "../../core/server";
import type * as koa from "koa";

export interface HKTContext extends server.HKTContext {
  readonly type: koa.ParameterizedContext<this["_TState"]>;
}

export const validateContextState: server.ContextValidatorFactory<
  HKTContext
> = (validator, protocolErrorInfo) => ({
  validator: (ctx) => {
    const transformed = validator(ctx.state);
    switch (transformed.error) {
      case "none":
        return {
          error: "none" as const,
          data: ctx as unknown as koa.ParameterizedContext<
            server.DataValidatorOutput<typeof validator>
          >,
        };
      default:
        return protocolErrorInfo === undefined
          ? {
              error: "error",
              errorInfo: transformed.errorInfo,
            }
          : {
              error: "protocol-error",
              statusCode:
                typeof protocolErrorInfo === "number"
                  ? protocolErrorInfo
                  : protocolErrorInfo.statusCode,
              body:
                typeof protocolErrorInfo === "number"
                  ? undefined
                  : protocolErrorInfo.body,
            };
    }
  },
  getState: (ctx) => ctx.state,
});

export const getStateFromContext: server.GetStateFromContext<HKTContext> = (
  ctx,
) => ctx.state;

// This is meant to be used by middleware occurring before the actual REST API.
export const modifyState = <TState>(
  ctx: koa.ParameterizedContext<TState>,
  modify: (state: TState) => void,
) => {
  modify(getStateFromContext(ctx));
};
