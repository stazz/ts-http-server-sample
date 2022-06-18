import * as core from "../core";

// Higher-kinded-type trick from: https://www.matechs.com/blog/encoding-hkts-in-typescript-once-again
export interface HKTContext {
  readonly _TState?: unknown;
  readonly type?: unknown;
}

export type HKTContextKind<F extends HKTContext, TState> = F extends {
  readonly type: unknown;
}
  ? (F & {
      readonly _TState: TState;
    })["type"]
  : never; // This is simplified version from original HKT pattern in the link, because we don't use the functional properties of this specific HKT.

export type ContextValidatorFactory<TContext extends HKTContext> = <
  TInput,
  TData,
  TError,
>(
  validator: core.DataValidator<TInput, TData, TError>,
  protocolErrorInfo?:
    | number
    | {
        statusCode: number;
        body: string | undefined;
      },
) => core.ContextValidatorSpec<
  HKTContextKind<TContext, TInput>,
  HKTContextKind<TContext, TData>,
  TData,
  TError
>;

export type DataValidatorOutput<T> = T extends core.DataValidator<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _,
  infer TData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _1
>
  ? TData
  : never;

export type GetStateFromContext<TContext extends HKTContext> = <TState>(
  context: HKTContextKind<TContext, TState>,
) => TState;
