import * as stream from "stream";

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

export interface QueryValidatorSpec<TQuery, TValidationError> {
  validator: QueryValidator<TQuery, TValidationError>;
}

export type QueryValidator<TQuery, TValidationError> =
  | {
      query: "string";
      validator: DataValidator<string, TQuery, TValidationError>;
    }
  | {
      query: "object";
      validator: DataValidator<
        Record<string, unknown>,
        TQuery,
        TValidationError
      >;
    };

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
