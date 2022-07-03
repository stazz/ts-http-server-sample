// Consumers of REST API (e.g. frontend, other microservice) written in TypeScript can include this file, to keep the application protocol DRY.
// Notice that this file is both server- and data validation -agnostic.
// It captures the essence of the HTTP protocol, and both backend and frontend can build on top of that.
// To see how backend does it for each data validation framework, see ./rest/<some data validation framework name>/things.ts files.

export interface ProtocolSpecCore<TMethod extends string, TOutput> {
  method: TMethod;
  responseBody: TOutput;
}

export interface ProtocolSpecHeaders<THeaders extends Record<string, string>> {
  // Key: header name
  // Value: functionality ID
  headers: THeaders;
}

export interface ProtocolSpecURL<TURLData extends Record<string, unknown>> {
  url: TURLData;
}

export interface ProtocolSpecQuery<TQueryData extends Record<string, unknown>> {
  query: TQueryData;
}

export interface ProtocolSpecRequestBody<TInput> {
  requestBody: TInput;
}

// Notice that these don't really need to implement ProtocolSpecXYYZ interface, as TS uses duck typing to check for type equality.
// Specifying the types like this instead of implementing the interfaces is a bit more readable IMO.
export interface APIGetThings {
  method: "GET";
  query: {
    includeDeleted?: boolean;
  };
  responseBody: Array<unknown>;
}

export interface APICreateThing {
  method: "POST";
  requestBody: DataThing;
  responseBody: DataThing;
}

export interface APIGetThing {
  url: {
    id: ID;
  };
  method: "GET";
  query: {
    includeDeleted?: boolean;
  };
  responseBody: string;
}

export interface APIConnectThings {
  url: {
    id: ID;
  };
  method: "POST";
  requestBody: {
    anotherThingId: ID;
  };
  responseBody: {
    connected: boolean;
    connectedAt: TimestampISO;
  };
}

export interface APIAuthenticated {
  method: "GET";
  responseBody: undefined;
  headers: {
    Authorization: "auth";
  };
}

export interface DataThing {
  property: string;
}

export type ID = string; // Really a UUID
export type TimestampISO = string; // Really ISO-formatted timestamp
