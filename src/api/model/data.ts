export type DataValidator<
  TData,
  TError,
  TInput,
  TOKString extends string,
  TErrorString extends string,
> = (
  this: void,
  data: TInput,
) => DataValidatorResponse<TData, TError, TOKString, TErrorString>;

export type DataValidatorInput<TData, TError> = DataValidator<
  TData,
  TError,
  unknown,
  "in-none",
  "in-error"
>;
export type DataValidatorOutput<TData, TError, TInput> = DataValidator<
  TData,
  TError,
  TInput,
  "out-none",
  "out-error"
>;

export type DataValidatorResponse<
  TData,
  TError,
  TOKString extends string,
  TErrorString extends string,
> =
  | {
      error: TOKString;
      data: TData;
    }
  | {
      error: TErrorString;
      errorInfo: TError;
    };

export type DataValidatorResponseOutput<TData, TError> = DataValidatorResponse<
  TData,
  TError,
  "out-none",
  "out-error"
>;
