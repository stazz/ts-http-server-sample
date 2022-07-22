// This is purely virtual interface for type deduction.
// No instances of this interface are meant to exist, therefore "& never" for field values.
export interface Encoded<TRuntime, TEncoded> {
  __runtime: TRuntime & never;
  __encoded: TEncoded & never;
}

// Higher-kinded-type trick from: https://www.matechs.com/blog/encoding-hkts-in-typescript-once-again
export interface HKTEncoded {
  // readonly _TRuntimeSpec?: unknown;
  readonly _TEncodedSpec?: unknown;
  // readonly typeRuntime?: unknown;
  readonly typeEncoded?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RuntimeOf<T> = T extends Encoded<infer TRuntime, infer _>
  ? TRuntime
  : T extends Array<infer U>
  ? GetRuntimeArray<U>
  : T extends object
  ? GetRuntimeObject<T>
  : T;
export type GetRuntimeObject<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof T]: T[P] extends Function ? T[P] : RuntimeOf<T[P]>;
};
export type GetRuntimeArray<T> = Array<RuntimeOf<T>>;

// export type RuntimeOf<F extends HKTEncoded, TSpec> = F extends {
//   readonly typeRuntime: unknown;
// }
//   ? (F & {
//       readonly _TRuntimeSpec: TSpec;
//     })["typeRuntime"]
//   : never; // This is simplified version from original HKT pattern in the link, because we don't use the functional properties of this specific HKT.

export type EncodedOf<F extends HKTEncoded, TSpec> = F extends {
  readonly typeEncoded: unknown;
}
  ? (F & {
      readonly _TEncodedSpec: TSpec;
    })["typeEncoded"]
  : never;
