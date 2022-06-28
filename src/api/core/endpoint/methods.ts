export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"; // And others...

export const HttpMethodsWithoutBody = {
  GET: true,
} as const;

export type HttpMethodWithoutBody = keyof typeof HttpMethodsWithoutBody;
export type HttpMethodWithBody = Exclude<HttpMethod, HttpMethodWithoutBody>;

export const isMethodWithoutBody = (
  method: HttpMethod,
): method is HttpMethodWithoutBody => method in HttpMethodsWithoutBody;
