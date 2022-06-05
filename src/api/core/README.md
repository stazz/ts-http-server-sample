# Generic REST API Endpoint Specification
This folder contains modules for various areas related to generically specify REST API endpoints:
- The code in [core](./core) folder contains the most commonly used and generic concepts:
    - data validation for input and output,
    - what single endpoint is required to have, and
    - some utility things (like HTTP methods and functionality used across whole spectrum of code in this sample).
- The code in [spec](./spec) folder contains the most complex part: the API to create REST API endpoint instances defined in [core](./core) with fully compile-time typesafe way.
  The example on how to use these abstractions is seen in [rest-endpoints.ts](../../rest-endpoints.ts) file in top-level [src](../../) folder.
- The code in [prefix](./prefix) folder contains functionality enabling to prefix multiple REST API endpoints with single static URL prefix, and appear as single, one REST API endpoint for other code.
  This also enables further prefixing already prefixed REST API endpoints.
- The code in [server](./server) folder contains fragments of functionality that is typically used by HTTP server plugins in [plugin server folder](../server).
- The code in [metadata](./metadata) folder contains API that allows to specify one or multiple metadata information about each of the REST API endpoints.
  This information is intended to be less formal documentation, like descriptions, summaries, etc.
  The more formal information about input/output schemas and such should be then generated automatically from concepts of [core](./core) folder by the [metadata plugins](../metadata).
