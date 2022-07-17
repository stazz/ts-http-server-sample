# Generic REST API Endpoint Specification Data Validation for Frontends - Zod
This folder contains code that implements data validation part for frontends, when they invoke HTTP endpoints.
The example on how define the endpoints can be seen in [protocol.ts file](../../../protocol.ts).
This code locks on to specific data validation library: [Zod](https://github.com/colinhacks/zod).

The exposed functionality is as follows:
- `createAPICallFactory` to be used to create object which in turns creates callbacks to invoke backend API.
  Utilizes the common functionality in [common module](../common).
