import type * as common from "../data";

export interface ContextValidatorSpec<
  TInput,
  TOutput,
  TState,
  TValidationError,
> {
  validator: ContextValidator<TInput, TOutput, TValidationError>;
  getState: (ctx: TOutput) => TState;
}

export type ContextValidator<TInput, TOutput, TValidationError> =
  common.DataValidator<
    TInput,
    TOutput,
    TValidationError,
    | common.DataValidatorResult<TOutput, TValidationError>
    | {
        error: "protocol-error";
        statusCode: number;
        body: string | undefined;
      }
  >;
