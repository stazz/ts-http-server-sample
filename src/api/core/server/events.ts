export interface RequestProcessingEvents<TContext, TState, TValidationError> {
  // URL did not match combined regex
  onInvalidUrl?: (
    args: Omit<EventArguments<TContext, TState>, "groups">,
  ) => unknown;
  onInvalidMethod?: (args: EventArguments<TContext, TState>) => unknown;
  onInvalidContext?: (
    args: EventArguments<TContext, TState> & {
      validationError: TValidationError | undefined;
    },
  ) => unknown;
  // URL matched combined regex, but parameter validation failed
  onInvalidUrlParameters?: (
    args: EventArguments<TContext, TState> &
      ValidationErrorArgs<Array<TValidationError>>,
  ) => unknown;
  onInvalidQuery?: (
    args: EventArguments<TContext, TState> &
      ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidContentType?: (
    args: EventArguments<TContext, TState> & { contentType: string },
  ) => unknown;
  onInvalidBody?: (
    args: EventArguments<TContext, TState> &
      ValidationErrorArgs<TValidationError>,
  ) => unknown;
  onInvalidResponse?: (
    args: EventArguments<TContext, TState> &
      ValidationErrorArgs<TValidationError>,
  ) => unknown;
}

export interface EventArguments<TContext, TState> {
  ctx: TContext;
  groups: Record<string, string>;
  regExp: RegExp;
  state: TState;
}

export interface ValidationErrorArgs<TValidationError> {
  validationError: TValidationError;
}
