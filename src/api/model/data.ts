import * as q from "querystring";
import * as stream from "stream";

export type DataValidator<
  TInput,
  TData,
  TError,
  TResponse = DataValidatorResult<TData, TError>,
> = (this: void, data: TInput) => TResponse;

export interface URLDataParameterValidatorSpec<TData, TError> {
  regExp: RegExp;
  validator: DataValidatorURL<TData, TError>;
}

export type DataValidatorURL<TData, TError> = DataValidator<
  string,
  TData,
  TError
>;

export type URLParameterDataType<T> = T extends DataValidatorURL<
  infer U,
  unknown
>
  ? U
  : never;

export type DataValidatorResult<TData, TError> =
  | {
      error: "none";
      data: TData;
    }
  | {
      error: "error";
      errorInfo: TError;
    };

export interface DataValidatorRequestInputSpec<TData, TError> {
  validator: DataValidatorRequestInput<TData, TError>;
}

export type DataValidatorRequestInput<TData, TError> = DataValidator<
  {
    contentType: string;
    input: stream.Readable;
  },
  TData,
  TError,
  Promise<
    | DataValidatorResult<TData, TError>
    | {
        error: "unsupported-content-type";
        supportedContentTypes: ReadonlyArray<string>;
      }
  >
>;

export interface DataValidatorResponseOutputSpec<TOutput, TError> {
  validator: DataValidatorResponseOutput<TOutput, TError>;
}

export type DataValidatorResponseOutput<TOutput, TError> = DataValidator<
  TOutput,
  DataValidatorResponseOutputSuccess,
  TError
>;

export type DataValidatorResponseOutputSuccess = {
  contentType: string;
  output: string | Buffer | stream.Readable;
};

export interface ContextValidatorSpec<
  TContext,
  TRefinedContext,
  TValidationError,
> {
  validator: ContextValidator<TContext, TRefinedContext, TValidationError>;
}

// TODO allow returning custom status codes from this one.
export type ContextValidator<TContext, TRefinedContext, TValidationError> =
  DataValidator<TContext, TRefinedContext, TValidationError>;

export interface QueryValidatorSpec<
  TQuery,
  TValidationError,
  TQueryKeys extends string,
> {
  validator: QueryValidator<TQuery, TValidationError>;
  queryParameterNames: ReadonlyArray<TQueryKeys>;
}

export type QueryValidator<TQuery, TValidationError> =
  | QueryValidatorForString<TQuery, TValidationError>
  | QueryValidatorForObject<TQuery, TValidationError>;

export interface QueryValidatorForString<TQuery, TValidationError> {
  query: "string";
  validator: DataValidator<string, TQuery, TValidationError>;
}

export interface QueryValidatorForObject<TQuery, TValidationError> {
  query: "object";
  validator: DataValidator<q.ParsedUrlQuery, TQuery, TValidationError>;
}

export const transitiveDataValidation =
  <TInput, TOutput, TIntermediate, TError>(
    first: DataValidator<TInput, TIntermediate, TError>,
    second: DataValidator<TIntermediate, TOutput, TError>,
  ): DataValidator<TInput, TOutput, TError> =>
  (input) => {
    const intermediate = first(input);
    switch (intermediate.error) {
      case "none":
        return second(intermediate.data);
      default:
        return intermediate;
    }
  };
