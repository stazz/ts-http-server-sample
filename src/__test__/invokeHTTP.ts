import * as feCommon from "../api/data-client/common";

import * as got from "got";
import { URL, URLSearchParams } from "url";

export const createCallHTTPEndpoint: (
  host: string,
  port: number,
) => feCommon.CallHTTPEndpoint =
  (host, port) =>
  async ({ headers, url, method, query, ...args }) => {
    const encoding = "utf8";
    const body =
      "body" in args
        ? Buffer.from(JSON.stringify(args.body), encoding)
        : undefined;
    const searchParams = query
      ? new URLSearchParams(
          Object.entries(query)
            .filter(([, value]) => value !== undefined)
            .flatMap<[string, string]>(([qKey, qValue]) =>
              Array.isArray(qValue)
                ? qValue.map<[string, string]>((value) => [qKey, `${value}`])
                : [[qKey, `${qValue}`]],
            ),
        )
      : undefined;
    const urlObject = new URL(`http://${host}:${port}${url}`);
    if (urlObject.pathname != url) {
      throw new Error(
        `Attempted to provide something else than pathname as URL: ${url}`,
      );
    }
    const { body: responseBody, statusCode } = await got.got({
      url: urlObject,
      method: method as got.Method,
      body,
      searchParams,
      headers: {
        // Notice that we allow overriding these specific headers with values in 'headers' below.
        // This is only because this callback is used in tests, and they require such functionality.
        // In reality, the spread of 'headers' should come first, and only then the headers related to body.
        // Even better, we should delete the reserved header names if body is not specified.
        ...(body === undefined
          ? {}
          : {
              ["Content-Type"]: "application/json",
              ["Content-Length"]: `${body.byteLength}`,
              ["Content-Encoding"]: encoding,
            }),
        ...headers,
      },
    });

    // Got will throw on any response which code is not >= 200 and < 300.
    // So just verify that it is one of the OK or No Content.
    if (statusCode !== 200 && statusCode !== 204) {
      throw new Error(`Status code ${statusCode} was returned.`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return responseBody.length > 0 ? JSON.parse(responseBody) : undefined;
  };
