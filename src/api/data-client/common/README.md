# Generic REST API Endpoint Specification Data Validation for Frontends - Common
This small module contains some common type code used when handling data validation on frontend side.

The exposed functionality is as follows:
- [api-call.ts](./api-call.ts) exposes `APICall` interface which is generic callback type for invoking HTTP endpoints,
- [api-call-factory.ts](./api-call-factory.ts) exposes interface on how to create `APICall` callbacks in typesafe manner,
- [api-call-factory-factory.ts](api-call-factory-factory.ts) exposes function on how to create instances of interface defined above.

The function exposed by [api-call-factory-factory.ts](api-call-factory-factory.ts) is not meant to be used directly by clients.
Instead, the data-validation-framework-specific modules use this to expose more user-friendly interface.
The following modules are available:
- [io-ts](../io-ts) for [IO-TS](https://github.com/gcanti/io-ts) library,
- [runtypes](../runtypes) for [IORuntypes](https://github.com/pelotom/runtypes) library, and
- [zod](../zod) for [Zod](https://github.com/colinhacks/zod) library.
