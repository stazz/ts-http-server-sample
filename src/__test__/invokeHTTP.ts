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
        ...headers,
        ...(body === undefined
          ? {}
          : {
              ["Content-Type"]: "application/json",
              ["Content-Length"]: `${body.byteLength}`,
              ["Content-Encoding"]: encoding,
            }),
      },
    });
    if (statusCode >= 200 && statusCode < 300) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return responseBody.length > 0 ? JSON.parse(responseBody) : undefined;
    } else {
      throw new Error(`Invalid response code: ${statusCode}`);
    }
  };
