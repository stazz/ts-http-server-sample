export type DataValidator<
  TInput,
  TData,
  TError,
  TResponse = DataValidatorResult<TData, TError>,
> = (this: void, data: TInput) => TResponse;

export type DataValidatorResult<TData, TError> =
  | {
      error: "none";
      data: TData;
    }
  | {
      error: "error";
      errorInfo: TError;
    };
