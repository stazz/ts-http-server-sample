export type DataValidator<
  TInput,
  TData,
  TError,
  ErrorTResponse = DataValidatorResultError<TError>,
> = (
  this: void,
  data: TInput,
) => DataValidatorResultSuccess<TData> | ErrorTResponse;

export type DataValidatorAsync<
  TInput,
  TData,
  TError,
  ErrorTResponse = DataValidatorResultError<TError>,
> = (
  this: void,
  data: TInput,
) => Promise<DataValidatorResultSuccess<TData> | ErrorTResponse>;

export type DataValidatorResult<TData, TError> =
  | DataValidatorResultSuccess<TData>
  | DataValidatorResultError<TError>;

export interface DataValidatorResultSuccess<TData> {
  error: "none";
  data: TData;
}
export interface DataValidatorResultError<TError> {
  error: "error";
  errorInfo: TError;
}
