import * as data from "./data";

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
  validator: data.DataValidator<TInput, TData, TError>,
  protocolErrorInfo?:
    | number
    | {
        statusCode: number;
        body: string | undefined;
      },
) => ContextValidatorSpec<
  HKTContextKind<TContext, TInput>,
  HKTContextKind<TContext, TData>,
  TData,
  TError
>;

export interface ContextValidatorSpec<
  TContext,
  TRefinedContext,
  TState,
  TValidationError,
> {
  validator: ContextValidator<TContext, TRefinedContext, TValidationError>;
  getState: (ctx: TRefinedContext) => TState;
}

export type ContextValidator<TContext, TRefinedContext, TValidationError> =
  data.DataValidator<
    TContext,
    TRefinedContext,
    TValidationError,
    | data.DataValidatorResult<TRefinedContext, TValidationError>
    | {
        error: "protocol-error";
        statusCode: number;
        body: string | undefined;
      }
  >;
