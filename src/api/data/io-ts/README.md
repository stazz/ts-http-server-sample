# Generic REST API Endpoint Specification Data Validation - IO-TS library
This folder contains code which implements the data validation layer specified by [core](../../core/core) module.
It does so by utilizing API exposed by [IO-TS](https://github.com/gcanti/io-ts) library.

The exposed functions include:
- `urlParameter` to create data validator for parameter within URL pathname,
- `queryValidator` to create data validator for parameter within URL search portion,
- `parameterString` and `parameterBoolean` for quick shortcuts for most commonly used types of URL and query parameters,
- `inputValidator` to create data validator for HTTP *request* body,
- `outputValidator` to create data validator for HTTP *response* body,
- `plainValidator` to create data validator for some other data, and
- `getHumanReadableErrorMessage` to extract human readable error message from IO-TS validation error object.
