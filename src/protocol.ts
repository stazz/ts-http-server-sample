// Notice that these don't really need to implement ProtocolSpecXYYZ interfaces in api/core/protocol, as TS uses duck typing to check for type equality.
// Specifying the types like this instead of implementing the interfaces is a bit more readable IMO.
// However, we still need protocol.Encoded type to specify the association between e.g. Date encoded as ISO timestamp string.
import type * as protocol from "./api/core/protocol";
export interface APIGetThings {
  method: "GET";
  query: {
    includeDeleted?: boolean;
    lastModified?: TimestampISO;
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

export type ID = string; // TODO use a class here. Branded types do not go well with generic non-brand-aware code.
export type TimestampISO = protocol.Encoded<Date, string>; // Really ISO-formatted timestamp
