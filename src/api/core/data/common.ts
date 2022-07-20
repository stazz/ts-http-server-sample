export type DataValidator<
  TInput,
  TData,
  ErrorTResponse = DataValidatorResultError,
> = (
  this: void,
  data: TInput,
) => DataValidatorResultSuccess<TData> | ErrorTResponse;

export type DataValidatorAsync<
  TInput,
  TData,
  ErrorTResponse = DataValidatorResultError,
> = (
  this: void,
  data: TInput,
) => Promise<DataValidatorResultSuccess<TData> | ErrorTResponse>;

export type DataValidatorResult<TData> =
  | DataValidatorResultSuccess<TData>
  | DataValidatorResultError;

export interface DataValidatorResultSuccess<TData> {
  error: "none";
  data: TData;
}
export interface DataValidatorResultError {
  error: "error";
  errorInfo: unknown;
  getHumanReadableMessage: () => string;
}

export type DataValidatorOutput<T> = T extends DataValidator<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _,
  infer TData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _1
>
  ? TData
  : never;
