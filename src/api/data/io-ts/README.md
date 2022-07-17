# Generic REST API Endpoint Specification Data Validation for both Backends and Frontends - IO-TS
This folder contains code which implement the data validation layer specified by [core module](../../core/data).
This code locks on to specific data validation library: [IO-TS](https://github.com/gcanti/io-ts).

- `getHumanReadableErrorMessage` function in [error.ts](./error.ts) allows transformation of IO-TS-specific error object into string message.
- `exceptionAsValidationError` function in [error.ts](./error.ts) allows creation of IO-TS-specific error object from e.g. exception.
- `GetRuntime` and `GetEncoded` types in [protocol.ts](./protocol.ts) allow convertion of `Encoded` types to their runtime and encoded formats.
  The definition of `Encoded` is in [protocol module](../../core/protocol/).
- `plainValidator` and `plainValidatorEncoder` functions in [validate.ts](./validate.ts) allow creation of `DataValidator` types from IO-TS `Type`s.
  The definition of `DataValidator` is in [core data module](../../core/data).
- `transformLibraryResultToModelResult` function in [utils.ts](./utils.ts) allows creation of `DataValidatorResult` from IO-TS `Validation` type.
  The definition of `DataValidatorResult` is in [core data module](../../core/data).