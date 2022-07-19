import type * as common from "../data";

export interface ContextValidatorSpec<TInput, TOutput, TState> {
  validator: ContextValidator<TInput, TOutput>;
  getState: (ctx: TOutput) => TState;
}

export type ContextValidator<TInput, TOutput> = common.DataValidator<
  TInput,
  TOutput,
  | common.DataValidatorResultError
  | {
      error: "protocol-error";
      statusCode: number;
      body: string | undefined;
    }
>;
