# Generic REST API Endpoint Specification Data Validation for both Backends and Frontends - Runtypes
This folder contains code which implement the data validation layer specified by [core module](../../core/data).
This code locks on to specific data validation library: [Runtypes](https://github.com/pelotom/runtypes).

- `getHumanReadableErrorMessage` function in [error.ts](./error.ts) allows transformation of Runtypes-specific error object into string message.
- `GetRuntime` and `GetEncoded` types in [protocol.ts](./protocol.ts) allow convertion of `Encoded` types to their runtime and encoded formats.
  The definition of `Encoded` is in [protocol module](../../core/protocol/).
- `plainValidator` and `encoder` functions in [validate.ts](./validate.ts) allow creation of `DataValidator` types from Runtypes `Runtype`s.
  The definition of `DataValidator` is in [core data module](../../core/data).
- `transformLibraryResultToModelResult` function in [utils.ts](./utils.ts) allows creation of `DataValidatorResult` from Runtypes `Result` type.
  The definition of `DataValidatorResult` is in [core data module](../../core/data).
