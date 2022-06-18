// This is 'virtual interface' -> instances of this interface are never meant to be created!
// It is only used for typing purposes
export interface VirtualRequestProcessingEvents<
  TContext,
  TState,
  TValidationError,
> {
  // URL did not match combined regex
  onInvalidUrl: Omit<EventArguments<TContext, TState>, "groups">;
  onInvalidMethod: EventArguments<TContext, TState>;
  onInvalidContext: EventArguments<TContext, TState> &
    ValidationErrorArgs<TValidationError | undefined>;
  // URL matched combined regex, but parameter validation failed
  onInvalidUrlParameters: EventArguments<TContext, TState> &
    ValidationErrorArgs<Array<TValidationError>>;
  onInvalidQuery: EventArguments<TContext, TState> &
    ValidationErrorArgs<TValidationError>;
  onInvalidContentType: EventArguments<TContext, TState> & {
    contentType: string;
  };
  onInvalidBody: EventArguments<TContext, TState> &
    ValidationErrorArgs<TValidationError>;
  onInvalidResponse: EventArguments<TContext, TState> &
    ValidationErrorArgs<TValidationError>;
}

export interface EventArguments<TContext, TState> {
  ctx: TContext;
  state: TState;
  groups: Record<string, string>;
  regExp: RegExp;
}

export interface ValidationErrorArgs<TValidationError> {
  validationError: TValidationError;
}
