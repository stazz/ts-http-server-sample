# Generic REST API Endpoint Specification Data Validation for Backends - IO-TS library
This folder contains code which implements the data validation layer specified by [core module](../../core/data-server).
It does so by utilizing API exposed by [IO-TS](https://github.com/gcanti/io-ts) library.

The exposed functions include:
- `urlParameter` in [validate-string.ts](./validate-string.ts) to create data validator for parameter within URL pathname,
- `queryValidator` in [validate-string.ts](./validate-string.ts) to create data validator for parameter within URL search portion,
- `parameterXYZ` functions in [string-parameters.ts](./string-parameters.ts) for quick shortcuts for most commonly used types of URL and query parameters,
- `inputValidator` in [validate-body.ts](./validate-body.ts) to create data validator for HTTP *request* body, and
- `outputValidator` in [validate-body.ts](./validate-body.ts) to create data validator for HTTP *response* body.
