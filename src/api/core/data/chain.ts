import type * as common from "./common";

export class ValidationChainer<
  TValidators extends Record<
    string,
    common.DataValidator<unknown, unknown, unknown, unknown>
  >,
> {
  public constructor(private readonly _state: TValidators) {}

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
    name: TName & (TName extends keyof TValidators ? never : {}),
    validator: TDataValidator | undefined,
  ): TDataValidator extends common.DataValidator<
    unknown,
    unknown,
    unknown,
    unknown
  >
    ? ValidationChainer<{
        [P in keyof TValidators | TName]: P extends keyof TValidators
          ? TValidators[P]
          : TDataValidator;
      }>
    : never {
    return (validator
      ? new ValidationChainer({
          ...this._state,
          [name]: validator,
        })
      : this) as unknown as TDataValidator extends common.DataValidator<
      unknown,
      unknown,
      unknown,
      unknown
    >
      ? ValidationChainer<{
          [P in keyof TValidators | TName]: P extends keyof TValidators
            ? TValidators[P]
            : TDataValidator;
        }>
      : never;
  }

  public getOutputs<TInputs extends Partial<GetInputs<TValidators>>>(
    inputs: TInputs,
  ):
    | common.DataValidatorResultSuccess<GetOutputs<TValidators, TInputs>>
    | common.DataValidatorResultError<
        Partial<GetErrors<TValidators, TInputs>>
      > {
    const outputs: GetOutputs<TValidators, TInputs> = {} as GetOutputs<
      TValidators,
      TInputs
    >;
    const errors: Partial<GetErrors<TValidators, TInputs>> = {};
    for (const [name, validator] of Object.entries(
      this._state as Record<
        string,
        common.DataValidator<unknown, unknown, unknown, unknown>
      >,
    )) {
      if (name in inputs) {
        const validationResult:
          | common.DataValidatorResultSuccess<unknown>
          | unknown = validator(inputs[name]);
        if (isSuccessResult(validationResult)) {
          outputs[name as keyof typeof outputs] =
            validationResult.data as typeof outputs[keyof typeof outputs];
        } else {
          errors[name as keyof typeof errors] = {
            error: "validator-error",
            errorInfo: validationResult,
          } as typeof errors[keyof typeof errors];
        }
      } else {
        errors[name as keyof typeof errors] = {
          error: "missing-validator",
        } as typeof errors[keyof typeof errors];
      }
    }

    return Object.keys(errors).length > 0
      ? {
          error: "error",
          errorInfo: errors,
        }
      : {
          error: "none",
          data: outputs,
        };
  }
}

const isSuccessResult = (
  val: unknown,
): val is common.DataValidatorResultSuccess<unknown> =>
  !!val &&
  typeof val === "object" &&
  "error" in val &&
  "data" in val &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (val as any).error === "none";

export type GetInputs<TValidators> = {
  [P in keyof TValidators]: TValidators[P] extends common.DataValidator<
    infer TInput,
    infer _,
    infer _1,
    infer _2
  >
    ? TInput
    : never;
};

export type GetOutputs<TValidators, TInputs> = {
  [P in keyof TInputs &
    keyof TValidators]: TValidators[P] extends common.DataValidator<
    infer _,
    infer TOutput,
    infer _1,
    infer _2
  >
    ? TOutput
    : never;
};

export type GetErrors<TValidators, TInputs> = {
  [P in keyof TInputs &
    keyof TValidators]: TValidators[P] extends common.DataValidator<
    infer _,
    infer _1,
    infer _2,
    infer TError
  >
    ? GetError<TError>
    : never;
};

export type GetError<TError> =
  | {
      error: "missing-validator";
    }
  | {
      error: "validator-error";
      errorInfo: TError;
    };
