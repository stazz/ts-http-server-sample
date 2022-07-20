import type * as protocol from "../../core/protocol";
import type * as data from "../../core/data";

export type APICall<TArgs, TReturnType> = (
  args: protocol.RuntimeOf<TArgs>,
) => Promise<APICallResult<TReturnType>>;

export type APICallResult<TReturnType> =
  | data.DataValidatorResult<protocol.RuntimeOf<TReturnType>>
  | {
      error: "error-input";
      errorInfo: Partial<{
        [P in "method" | "url" | "query" | "body"]: data.GetError;
      }>;
    };

export type GetAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown>,
> =
  // We need to repeat "extends protocol.ProtocolSpecCore<string, unknown> &" for all of the conditions.
  // Otherwise, at least the first variant will become "never" when used.
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> & {
    [P in keyof (protocol.ProtocolSpecQuery<Record<string, unknown>> &
      protocol.ProtocolSpecRequestBody<unknown> &
      protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
  }
    ? APICall<void, TProtocolSpec["responseBody"]>
    : TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
        protocol.ProtocolSpecQuery<Record<string, unknown>> & {
          [P in keyof (protocol.ProtocolSpecRequestBody<unknown> &
            protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
        }
    ? APICall<{ query: TProtocolSpec["query"] }, TProtocolSpec["responseBody"]>
    : TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
        protocol.ProtocolSpecRequestBody<unknown> & {
          [P in keyof (protocol.ProtocolSpecQuery<Record<string, unknown>> &
            protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
        }
    ? APICall<
        { body: TProtocolSpec["requestBody"] },
        TProtocolSpec["responseBody"]
      >
    : TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
        protocol.ProtocolSpecURL<Record<string, unknown>> & {
          [P in keyof (protocol.ProtocolSpecRequestBody<unknown> &
            protocol.ProtocolSpecQuery<Record<string, unknown>>)]?: never;
        }
    ? APICall<{ url: TProtocolSpec["url"] }, TProtocolSpec["responseBody"]>
    : TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
        protocol.ProtocolSpecQuery<Record<string, unknown>> &
        protocol.ProtocolSpecRequestBody<unknown> & {
          [P in keyof protocol.ProtocolSpecURL<
            Record<string, unknown>
          >]?: never;
        }
    ? APICall<
        { query: TProtocolSpec["query"]; body: TProtocolSpec["requestBody"] },
        TProtocolSpec["responseBody"]
      >
    : TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
        protocol.ProtocolSpecQuery<Record<string, unknown>> &
        protocol.ProtocolSpecURL<Record<string, unknown>> & {
          [P in keyof protocol.ProtocolSpecRequestBody<unknown>]?: never;
        }
    ? APICall<
        { query: TProtocolSpec["query"]; url: TProtocolSpec["url"] },
        TProtocolSpec["responseBody"]
      >
    : TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
        protocol.ProtocolSpecRequestBody<unknown> &
        protocol.ProtocolSpecURL<Record<string, unknown>> & {
          [P in keyof protocol.ProtocolSpecQuery<
            Record<string, unknown>
          >]?: never;
        }
    ? APICall<
        { body: TProtocolSpec["requestBody"]; url: TProtocolSpec["url"] },
        TProtocolSpec["responseBody"]
      >
    : TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
        protocol.ProtocolSpecQuery<Record<string, unknown>> &
        protocol.ProtocolSpecRequestBody<unknown> &
        protocol.ProtocolSpecURL<Record<string, unknown>>
    ? APICall<
        {
          query: TProtocolSpec["query"];
          body: TProtocolSpec["requestBody"];
          url: TProtocolSpec["url"];
        },
        TProtocolSpec["responseBody"]
      >
    : never;

export type GetAPICalls<
  T extends Record<string, protocol.ProtocolSpecCore<string, unknown>>,
> = {
  [P in keyof T]: GetAPICall<T[P]>;
};
