import * as protocol from "../../core/protocol";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type GetRuntime<T> = protocol.RuntimeOf<T>;

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

export interface HKTEncoded extends protocol.HKTEncoded {
  readonly typeEncoded: GetEncoded<this["_TEncodedSpec"]>;
}
