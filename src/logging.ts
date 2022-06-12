// Import code to create REST API endpoints
import * as server from "./api/core/server";
import * as endpoints from "./rest-endpoints";

export const logServerEvents = <TContext, TValidationError>(
  getMethodAndUrl: (
    this: void,
    ctx: TContext,
  ) => { method: string; url: string },
  getValidationErrorMessage: (this: void, error: TValidationError) => string,
): server.RequestProcessingEvents<
  TContext,
  endpoints.State,
  TValidationError
> => ({
  onInvalidBody: ({ state, ctx, validationError }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid body: ${method} ${url} (user: ${
        state.username
      }), validation error:\n${getValidationErrorMessage(validationError)}`,
    );
  },
  onInvalidUrl: ({ state, ctx }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid URL supplied: ${method} ${url} (user: ${state.username})`,
    );
  },
  onInvalidUrlParameters: ({ ctx, validationError }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid URL parameters supplied: ${method} ${url}.\n${validationError
        .map((error) => getValidationErrorMessage(error))
        .join("  \n")}`,
    );
  },
  onInvalidQuery: ({ ctx, validationError }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid query supplied: ${method} ${url}.\n${getValidationErrorMessage(
        validationError,
      )}`,
    );
  },
  onInvalidMethod: ({ state, ctx }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid Method supplied: ${method} ${url} (user: ${state.username})`,
    );
  },
  onInvalidContentType: ({ state, ctx, contentType }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid content type specified: ${method} ${url} (user: ${state.username}): ${contentType}`,
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
      `Invalid response: ${method} ${url} (user: ${
        state.username
      }), validation error:\n${getValidationErrorMessage(validationError)}`,
    );
  },
});
