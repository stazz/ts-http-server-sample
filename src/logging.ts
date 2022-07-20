import * as data from "./api/core/data";
import type * as server from "./api/core/server";
import type * as serverModule from "./module-api/server";
import * as evt from "@data-heaving/common";

export const logServerEvents = <TContext>(
  getMethodAndUrl: serverModule.GetMethodAndURL<TContext>,
  getStateString: (state: serverModule.State) => string,
  builder?: evt.EventEmitterBuilder<
    server.VirtualRequestProcessingEvents<TContext, serverModule.State>
  >,
) => {
  if (!builder) {
    builder = new evt.EventEmitterBuilder();
  }
  builder.addEventListener("onSuccessfulInvocationStart", ({ state, ctx }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.info(`Starting invoking ${method} ${url} ${getStateString(state)}`);
  });
  builder.addEventListener("onSuccessfulInvocationEnd", ({ state, ctx }) => {
    const { method, url } = getMethodAndUrl(ctx);
    // eslint-disable-next-line no-console
    console.info(
      `Completed invoking ${method} ${url} ${getStateString(state)}`,
    );
  });
  builder.addEventListener(
    "onInvalidBody",
    ({ state, ctx, validationError }) => {
      const { method, url } = getMethodAndUrl(ctx);
      // eslint-disable-next-line no-console
      console.error(
        `Invalid body: ${method} ${url} ${getStateString(
          state,
        )}, validation error:\n${validationError.getHumanReadableMessage()}`,
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
        )}.\n${data.combineErrorObjects(validationError)}`,
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
        )}.\n${validationError.getHumanReadableMessage()}`,
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
          ? validationError.getHumanReadableMessage()
          : "Protocol-related error"
      }`,
    );
  });
  builder.addEventListener(
    "onInvalidResponse",
    ({ state, ctx, validationError }) => {
      const { method, url } = getMethodAndUrl(ctx);
      // eslint-disable-next-line no-console
      console.error(
        `Invalid response: ${method} ${url} ${getStateString(
          state,
        )}, validation error:\n${validationError.getHumanReadableMessage()}`,
      );
    },
  );
  return builder;
};
