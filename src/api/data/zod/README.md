# Generic REST API Endpoint Specification Data Validation - Zod library
This folder contains code which implements the data validation layer specified by [core](../../core/core) module.
It does so by utilizing API exposed by [Zod](https://github.com/colinhacks/zod) library.

The exposed functions include:
- `urlParameter` in `validate-string.ts` to create data validator for parameter within URL pathname,
- `queryValidator` in `validate-string.ts` to create data validator for parameter within URL search portion,
- `parameterString` and `parameterBoolean` in `string-parameters.ts` for quick shortcuts for most commonly used types of URL and query parameters,
- `inputValidator` in `validate-body.ts` to create data validator for HTTP *request* body,
- `outputValidator` in `validate-body.ts` to create data validator for HTTP *response* body,
- `plainValidator` in `validate.ts` to create data validator for some other data, and
- `getHumanReadableErrorMessage` in `error.ts` to extract human readable error message from IO-TS validation error object.
