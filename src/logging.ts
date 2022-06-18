// Import code to create REST API endpoints
import type * as server from "./api/core/server";

export const logServerEvents = <TContext, TState, TValidationError>(
  getMethodAndUrl: (
    this: void,
    ctx: TContext,
  ) => { method: string; url: string },
  getStateString: (state: TState) => string,
  getValidationErrorMessage: (this: void, error: TValidationError) => string,
): server.RequestProcessingEvents<TContext, TState, TValidationError> => ({
  onInvalidBody: ({ state, ctx, validationError }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid body: ${method} ${url} ${getStateString(
        state,
      )}, validation error:\n${getValidationErrorMessage(validationError)}`,
    );
  },
  onInvalidUrl: ({ state, ctx }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid URL supplied: ${method} ${url} ${getStateString(state)}`,
    );
  },
  onInvalidUrlParameters: ({ state, ctx, validationError }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid URL parameters supplied: ${method} ${url} ${getStateString(
        state,
      )}.\n${validationError
        .map((error) => getValidationErrorMessage(error))
        .join("  \n")}`,
    );
  },
  onInvalidQuery: ({ state, ctx, validationError }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid query supplied: ${method} ${url} ${getStateString(
        state,
      )}.\n${getValidationErrorMessage(validationError)}`,
    );
  },
  onInvalidMethod: ({ state, ctx }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid Method supplied: ${method} ${url} ${getStateString(state)}`,
    );
  },
  onInvalidContentType: ({ state, ctx, contentType }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid content type specified: ${method} ${url} ${getStateString(
        state,
      )}: ${contentType}`,
    );
  },
  onInvalidContext: ({ state, validationError }) => {
    // eslint-disable-next-line no-console
    console.error(
      `State validation failed for ${JSON.stringify(state)}.\n${
        validationError
          ? getValidationErrorMessage(validationError)
          : "Protocol-related error"
      }`,
    );
  },
  onInvalidResponse: ({ state, ctx, validationError }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid response: ${method} ${url} ${getStateString(
        state,
      )}, validation error:\n${getValidationErrorMessage(validationError)}`,
    );
  },
});
