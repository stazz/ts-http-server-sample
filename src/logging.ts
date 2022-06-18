// Import code to create REST API endpoints
import type * as server from "./api/core/server";
import * as evt from "@data-heaving/common";

export type GetMethodAndURL<TContext extends server.HKTContext> = <TState>(
  this: void,
  context: server.HKTContextKind<TContext, TState>,
) => { method: string; url: string };

export const logServerEvents = <
  TContext extends server.HKTContext,
  TState,
  TValidationError,
>(
  getMethodAndUrl: GetMethodAndURL<TContext>,
  getStateString: (state: TState) => string,
  getValidationErrorMessage: (this: void, error: TValidationError) => string,
  builder?: evt.EventEmitterBuilder<
    server.VirtualRequestProcessingEvents<
      server.HKTContextKind<TContext, TState>,
      TState,
      TValidationError
    >
  >,
): evt.EventEmitterBuilder<
  server.VirtualRequestProcessingEvents<
    server.HKTContextKind<TContext, TState>,
    TState,
    TValidationError
  >
> => {
  if (!builder) {
    builder = new evt.EventEmitterBuilder();
  }
  builder.addEventListener(
    "onInvalidBody",
    ({ state, ctx, validationError }) => {
      const { method, url } = getMethodAndUrl(ctx);
      // eslint-disable-next-line no-console
      console.error(
        `Invalid body: ${method} ${url} ${getStateString(
          state,
        )}, validation error:\n${getValidationErrorMessage(validationError)}`,
      );
    },
  );
  builder.addEventListener("onInvalidUrl", ({ state, ctx }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid URL supplied: ${method} ${url} ${getStateString(state)}`,
    );
  });
  builder.addEventListener(
    "onInvalidUrlParameters",
    ({ state, ctx, validationError }) => {
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
  );
  builder.addEventListener(
    "onInvalidQuery",
    ({ state, ctx, validationError }) => {
      const { method, url } = getMethodAndUrl(ctx);
      // eslint-disable-next-line no-console
      console.error(
        `Invalid query supplied: ${method} ${url} ${getStateString(
          state,
        )}.\n${getValidationErrorMessage(validationError)}`,
      );
    },
  );
  builder.addEventListener("onInvalidMethod", ({ state, ctx }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.error(
      `Invalid Method supplied: ${method} ${url} ${getStateString(state)}`,
    );
  });
  builder.addEventListener(
    "onInvalidContentType",
    ({ state, ctx, contentType }) => {
      const { method, url } = getMethodAndUrl(ctx);
      // eslint-disable-next-line no-console
      console.error(
        `Invalid content type specified: ${method} ${url} ${getStateString(
          state,
        )}: ${contentType}`,
      );
    },
  );
  builder.addEventListener("onInvalidContext", ({ state, validationError }) => {
    // eslint-disable-next-line no-console
    console.error(
      `State validation failed for ${JSON.stringify(state)}.\n${
        validationError
          ? getValidationErrorMessage(validationError)
          : "Protocol-related error"
      }`,
    );
  }),
    builder.addEventListener(
      "onInvalidResponse",
      ({ state, ctx, validationError }) => {
        const { method, url } = getMethodAndUrl(ctx);
        // eslint-disable-next-line no-console
        console.error(
          `Invalid response: ${method} ${url} ${getStateString(
            state,
          )}, validation error:\n${getValidationErrorMessage(validationError)}`,
        );
      },
    );
  return builder;
};
