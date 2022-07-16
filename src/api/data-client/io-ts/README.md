# Generic REST API Endpoint Specification Data Validation for Frontends - IO-TS
This folder contains code that implements data validation part for frontends, when they invoke HTTP endpoints.
The example on how define the endpoints can be seen in [protocol.ts file](../../../protocol.ts).
This code locks on to specific data validation library: [IO-TS](https://github.com/gcanti/io-ts).

The exposed functionality is as follows:
- [api-call-factory.ts](./api-call-factory.ts) exposes interface on how to create callback which invokes given HTTP endpoint, in typesafe manner,
- [api-call-factory-factory.ts](api-call-factory-factory.ts) exposes function on how to create instances of interface defined above.
