import type * as common from "../data";

export interface HeaderDataValidatorSpec<
  THeaderData extends Record<string, unknown>,
> {
  validators: {
    [P in keyof THeaderData]: common.DataValidator<string, THeaderData[P]>;
  };
  // Instead of this - OpenAPI generation can utilize the 'getUndefinedStatus' callback passed to it, to each of the validators.
  // isParameterRequired: Record<keyof THeaderData, boolean>;
}
