import * as protocol from "../../core/protocol";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type GetRuntime<T> = T extends protocol.Encoded<infer TRuntime, infer _>
  ? TRuntime
  : T extends Array<infer U>
  ? GetRuntimeArray<U>
  : T extends object
  ? GetRuntimeObject<T>
  : T;
export type GetRuntimeObject<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof T]: T[P] extends Function ? T[P] : GetRuntime<T[P]>;
};
export type GetRuntimeArray<T> = Array<GetRuntime<T>>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type GetEncoded<T> = T extends protocol.Encoded<infer _, infer TEncoded>
  ? TEncoded
  : T extends Array<infer U>
  ? GetEncodedArray<U>
  : T extends object
  ? GetEncodedObject<T>
  : T;
export type GetEncodedObject<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof T]: T[P] extends Function ? T[P] : GetEncoded<T[P]>;
};
export type GetEncodedArray<T> = Array<GetEncoded<T>>;
