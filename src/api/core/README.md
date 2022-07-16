# Generic REST API Endpoint Specification - Core
This folder contains modules for various areas related to generically specify REST API endpoints.
Unless explicitly mentioned, each of the library mentioned below is meant to be used in context of backend which runs HTTP server implementing the domain-specific protocol.
- The code in [protocol](./protocol) folder contains type definitions about specifying protocol consisting of multiple HTTP endpoints, for both backend and frontend.
- The code in [data](./data) folder contains type definitions and generic functions about data validaton for input and output, for both backend and frontend.
- The code in [data-server](./data-server) folder enhances the concepts of [data](./data) folder with the ones which are required only in backend.
- The code in [endpoint](./endpoint) folder contains type definitions about what single HTTP endpoint is required to have.
- The code in [spec](./spec) folder is about the API to create REST API endpoint instances defined in [core](./core) with fully compile-time typesafe way.
  The example on how to use these abstractions is seen in [rest-endpoints.ts](../../rest-endpoints.ts) file in top-level [src](../../) folder.
- The code in [prefix](./prefix) folder contains functionality enabling to prefix multiple REST API endpoints with single static URL prefix, and appear as single, one REST API endpoint for other code.
  This also enables further prefixing already prefixed REST API endpoints.
- The code in [server](./server) folder contains fragments of functionality that is typically used by HTTP server plugins in [plugin server folder](../server).
- The code in [metadata](./metadata) folder contains API that allows to specify one or multiple metadata information about each of the REST API endpoints.
  This information is intended to be less formal documentation, like descriptions, summaries, etc.
  The more formal information about input/output schemas and such should be then generated automatically from concepts of [core](./core) folder by the [metadata plugins](../metadata).
