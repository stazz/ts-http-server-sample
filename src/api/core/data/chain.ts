import type * as common from "./common";

export class ValidationChainer<
  TInputs extends Record<string, unknown>,
  TOutputs extends Record<string, unknown>,
  TErrors,
> {
  public constructor(
    private readonly _state: {
      [P in keyof TInputs & keyof TOutputs]: TValidatorChainStateComponent;
    },
  ) {}

  public withInput<
    TName extends string,
    TDataValidator extends common.DataValidator<
      unknown,
      unknown,
      unknown,
      unknown
    >,
  >(
    // eslint-disable-next-line @typescript-eslint/ban-types
    name: TName & (TName extends keyof TInputs ? never : {}),
    validatorInfo:
      | {
          validator: TDataValidator;
        }
      | undefined,
  ): TDataValidator extends common.DataValidator<
    infer TInput,
    infer TOutput,
    infer TError,
    infer TErrorResponse
  >
    ? ValidationChainer<
        TInputs & { [P in TName]: TInput },
        TOutputs & { [P in TName]: TOutput },
        TErrors | TErrorResponse
      >
    : never {
    return (
      validatorInfo
        ? new ValidationChainer({
            ...this._state,
            [name]: {
              validator: validatorInfo.validator,
            },
          } as { [P in keyof TInputs | (TName & keyof TOutputs) | TName]: TValidatorChainStateComponent })
        : this
    ) as TDataValidator extends common.DataValidator<
      infer TInput,
      infer TOutput,
      infer TError,
      infer TErrorResponse
    >
      ? ValidationChainer<
          TInputs & { [P in TName]: TInput },
          TOutputs & { [P in TName]: TOutput },
          TErrors | TErrorResponse
        >
      : never;
  }

  public getOutputs(
    input: Partial<TInputs>,
  ):
    | common.DataValidatorResultSuccess<TOutputs>
    | common.DataValidatorResultError<Array<TErrors>> {
    const outputs: Partial<TOutputs> = {};
    const errors: Array<TErrors> = [];
    for (const [name, { validator, tryGetOutput }] of Object.entries(
      this._state as Record<string, TValidatorChainStateComponent>,
    )) {
      const validationResult = validator(input[name]);
      const maybeSuccess = tryGetOutput(validationResult);
      if (maybeSuccess?.error === "none") {
        outputs[name as keyof TOutputs] =
          maybeSuccess.data as TOutputs[keyof TOutputs];
      } else {
        errors.push(validationResult as typeof errors[number]);
      }
    }

    return errors.length > 0
      ? {
          error: "error",
          errorInfo: errors,
        }
      : {
          error: "none",
          data: outputs as TOutputs,
        };
  }
}

export interface TValidatorChainStateComponent {
  validator: common.DataValidator<unknown, unknown, unknown, unknown>;
  tryGetOutput: (
    this: void,
    result: unknown,
  ) => common.DataValidatorResultSuccess<unknown> | undefined;
}

export const start = <
  TName extends string,
  TDataValidator extends common.DataValidator<
    unknown,
    unknown,
    unknown,
    unknown
  >,
>(
  name: TName,
  validator: TDataValidator,
): TDataValidator extends common.DataValidator<
  infer TInput,
  infer TOutput,
  infer TError,
  infer TErrorResponse
>
  ? ValidationChainer<
      { [P in TName]: TInput },
      { [P in TName]: TOutput },
      TErrorResponse
    >
  : never =>
  new ValidationChainer({
    [name]: {
      validator,
    },
  } as unknown as { [P in TName]: TValidatorChainStateComponent }) as TDataValidator extends common.DataValidator<
    infer TInput,
    infer TOutput,
    infer TError,
    infer TErrorResponse
  >
    ? ValidationChainer<
        { [P in TName]: TInput },
        { [P in TName]: TOutput },
        TErrorResponse
      >
    : never;
