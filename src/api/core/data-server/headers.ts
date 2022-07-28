import type * as common from "../data";

export interface HeaderDataValidatorSpec<
  THeaderData extends RuntimeAnyHeaders,
> {
  validators: HeaderDataValidators<THeaderData>;
  // Instead of this - OpenAPI generation can utilize the 'getUndefinedStatus' callback passed to it, to each of the validators.
  // isParameterRequired: Record<keyof THeaderData, boolean>;
}

export type HeaderDataValidators<THeaderData extends RuntimeAnyHeaders> = {
  [P in keyof THeaderData]: common.DataValidator<
    string | Array<string> | undefined,
    THeaderData[P]
  >;
};

export type RuntimeAnyHeaders = Record<string, unknown>;
