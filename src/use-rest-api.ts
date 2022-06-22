// This file is not used by this sample
// It only exists to demonstrate how to use shared code in protocol.ts
// Notice that it doesn't use runtime validation - but one can build such on top of this simple sample.
// Also notice that URL building is now a bit duplicated. This is not optimal, and will be refactored to be DRY later.
import * as protocol from "./protocol";

// Example of how to use types in protocol.ts to define API callbacks and invoke them.
const useAPI = async () => {
  // Define callbacks in compile-time safe way
  const getThings = makeAPICall<protocol.APIGetThings>("GET");
  const createThing = makeAPICall<protocol.APICreateThing>("POST");
  const getThing = makeAPICall<protocol.APIGetThing>(
    "GET",
    ({ id }) => `/api/thing/${id}`,
  );
  const connectThings = makeAPICall<protocol.APIConnectThings>(
    "POST",
    ({ id }) => `/api/thing/${id}/connectToAnotherThing`,
  );
  const authenticatedEndpoint = makeAPICall<protocol.APIAuthenticated>("GET");

  // Invoke callbacks
  const id: protocol.ID = "00000000-0000-0000-0000-000000000000";
  const things = await getThings({ query: {} });
  const createdThing = await createThing({ body: { property: id } });
  const thing = await getThing({ url: { id }, query: {} });
  const connectInfo = await connectThings({
    url: { id },
    body: { anotherThingId: id.replaceAll("0", "1") },
  });
  const authResult = await authenticatedEndpoint();
};

// These overloads are a bit fugly but oh well...

// Overload for 1-form
function makeAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> & {
    [P in keyof (protocol.ProtocolSpecQuery<Record<string, unknown>> &
      protocol.ProtocolSpecRequestBody<unknown> &
      protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
  },
>(
  method: TProtocolSpec["method"],
): APICall<void, TProtocolSpec["responseBody"]>;

// Overloads for 2-forms
function makeAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
    protocol.ProtocolSpecQuery<Record<string, unknown>> & {
      [P in keyof (protocol.ProtocolSpecRequestBody<unknown> &
        protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
    },
>(
  method: TProtocolSpec["method"],
): APICall<{ query: TProtocolSpec["query"] }, TProtocolSpec["responseBody"]>;
function makeAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
    protocol.ProtocolSpecRequestBody<unknown> & {
      [P in keyof (protocol.ProtocolSpecQuery<Record<string, unknown>> &
        protocol.ProtocolSpecURL<Record<string, unknown>>)]?: never;
    },
>(
  method: TProtocolSpec["method"],
): APICall<
  { body: TProtocolSpec["requestBody"] },
  TProtocolSpec["responseBody"]
>;
function makeAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
    protocol.ProtocolSpecURL<Record<string, unknown>> & {
      [P in keyof (protocol.ProtocolSpecRequestBody<unknown> &
        protocol.ProtocolSpecQuery<Record<string, unknown>>)]?: never;
    },
>(
  method: TProtocolSpec["method"],
  buildURL: (urlParams: TProtocolSpec["url"]) => string,
): APICall<{ url: TProtocolSpec["url"] }, TProtocolSpec["responseBody"]>;

// Overloads for 3-forms
function makeAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
    protocol.ProtocolSpecQuery<Record<string, unknown>> &
    protocol.ProtocolSpecRequestBody<unknown> & {
      [P in keyof protocol.ProtocolSpecURL<Record<string, unknown>>]?: never;
    },
>(
  method: TProtocolSpec["method"],
): APICall<
  { query: TProtocolSpec["query"]; body: TProtocolSpec["requestBody"] },
  TProtocolSpec["responseBody"]
>;
function makeAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
    protocol.ProtocolSpecQuery<Record<string, unknown>> &
    protocol.ProtocolSpecURL<Record<string, unknown>> & {
      [P in keyof protocol.ProtocolSpecRequestBody<unknown>]?: never;
    },
>(
  method: TProtocolSpec["method"],
  buildURL: (urlParams: TProtocolSpec["url"]) => string,
): APICall<
  { query: TProtocolSpec["query"]; url: TProtocolSpec["url"] },
  TProtocolSpec["responseBody"]
>;
function makeAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
    protocol.ProtocolSpecRequestBody<unknown> &
    protocol.ProtocolSpecURL<Record<string, unknown>> & {
      [P in keyof protocol.ProtocolSpecQuery<Record<string, unknown>>]?: never;
    },
>(
  method: TProtocolSpec["method"],
  buildURL: (urlParams: TProtocolSpec["url"]) => string,
): APICall<
  { body: TProtocolSpec["requestBody"]; url: TProtocolSpec["url"] },
  TProtocolSpec["responseBody"]
>;

// Overload for 4-form
function makeAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
    protocol.ProtocolSpecQuery<Record<string, unknown>> &
    protocol.ProtocolSpecRequestBody<unknown> &
    protocol.ProtocolSpecURL<Record<string, unknown>>,
>(
  method: TProtocolSpec["method"],
  buildURL: (urlParams: TProtocolSpec["url"]) => string,
): APICall<
  {
    query: TProtocolSpec["query"];
    body: TProtocolSpec["requestBody"];
    url: TProtocolSpec["url"];
  },
  TProtocolSpec["responseBody"]
>;

// Implementation
function makeAPICall<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown>,
>(
  method: string,
  buildURL?: (urlParams: Record<string, unknown>) => string,
): APICall<Record<string, unknown> | void, TProtocolSpec["responseBody"]> {
  // This implementation could accept some runtime type validation objects to validate all the arguments, and return value, at runtime
  return (args) =>
    someMethodToInvokeHTTPEndpoint({
      method,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      url: args && "url" in args && buildURL ? buildURL(args.url as any) : "",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      query: args && "query" in args ? (args.query as any) : {},
      body: args && "body" in args ? args.body : undefined,
    });
}

export type APICall<TArgs, TReturnType> = (args: TArgs) => Promise<TReturnType>;

const someMethodToInvokeHTTPEndpoint = (args: {
  method: string;
  url: string;
  query?: Record<string, unknown>;
  body?: unknown;
}): Promise<unknown> => {
  throw new Error(
    "This exists only to simulate signature of some way of invoking HTTP endpoint in the client.",
  );
};
