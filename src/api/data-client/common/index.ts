export type HeaderProvider = (
  args: Omit<HTTPInvocationArguments, "headers"> & { headerName: string },
) => string | PromiseLike<string>;

export interface HTTPInvocationArguments {
  method: string;
  url: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

export type CallHTTPEndpoint = (
  args: HTTPInvocationArguments,
) => Promise<unknown>;
