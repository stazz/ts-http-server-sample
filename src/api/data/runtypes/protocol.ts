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
// We have to do these in a different way than IO-TS, as the way Runtypes specifies optionality is not 1:1 with how TypeScript handles it.
export type GetEncodedObject<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in NonOptionalKeys<T>]: T[P] extends Function ? T[P] : GetEncoded<T[P]>;
} & {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof Omit<T, NonOptionalKeys<T>>]: T[P] extends Function
    ? T[P]
    : GetEncoded<T[P]> | undefined;
};
export type GetEncodedArray<T> = Array<GetEncoded<T>>;
export type NonOptionalKeys<T> = {
  [k in keyof T]-?: undefined extends T[k] ? never : k;
}[keyof T];

export interface HKTEncoded extends protocol.HKTEncoded {
  readonly typeRuntime: GetRuntime<this["_TRuntimeSpec"]>;
  readonly typeEncoded: GetEncoded<this["_TEncodedSpec"]>;
}
