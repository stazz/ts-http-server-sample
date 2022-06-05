# REST API -Related Code
This folder contains code related to REST API concepts - HTTP protocol nuances (URLs, queries, headers, body, methods), running HTTP server, validating data at runtime, and specifying metadata about REST API endpoints.
The code is further structured into the following parts:

- The folder [core](./core) contains code which is not dependant on any specific library, instead defining REST concepts in generic way.
  The exposed API allows to define REST API endpoints in highly configurable and compile-time-safe way.
- The folder [data](./data) contains plugins which utilize concepts defined in [core](./core) folder to provide REST API data validation with some concrete data validation library.
  Because this is just a sample, only IO-TS library is supported in [data/io-ts](./data/io-ts) subfolder.
  Other subfolders contain just empty files.
- The folder [server](./server) contains plugins which provide middleware capable of running REST API endpoints defined using concepts defined by code in [core](./core) folder, aimed for concrete HTTP server library.
  Because this is just a sample, only Koa library is supported in [server/koa](./server/koa) subfolder.
  Other subfolders contain just empty files.
- The folder [metadata](./metadata) contains plugins which provide ability to augment REST API definitions created by code in [core](./core) folder with metadata specific to concrete metadata specification, e.g. OpenAPI.
  This allows specifying the metadata about endpoints right where the endpoints are defined, thus lessening the threshold to provide the metadata.
  Furthermore, it allows for automatic generation of the metadata about all the endpoints, thus dissolving the gap between manually upkept metadata and actual code.
  Because this is just a sample, only OpenAPI specification is supported in [metadata/openapi](./metadata/openapi) folder.
  The same reason is why the code in the same folder does not yet auto-generate JSON schemas based from data validation specification of inputs and outputs of the REST API endpoints.
