import * as server from "../../core/server";
import type * as ctx from "./context-types";
import * as state from "./state-internal";

export interface HKTContext extends server.HKTContext {
  readonly type: ctx.Context<this["_TState"]>;
}

export const validateContextState: server.ContextValidatorFactory<
  HKTContext
> = (validator, protocolErrorInfo) => ({
  validator: (ctx) => {
    const transformed = validator(state.doGetStateFromContext(ctx));
    switch (transformed.error) {
      case "none":
        return {
          error: "none" as const,
          data: ctx as unknown as ctx.Context<
            server.DataValidatorOutput<typeof validator>
          >,
        };
      default:
        return protocolErrorInfo === undefined
          ? transformed
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
  getState: state.doGetStateFromContext,
});
