# REST API -Related Code
This folder contains code related to REST API concepts - URLs, queries, headers, body, methods, etc.
The code is further structured in two parts:
- The folder [model](./model) contains code which is not dependant on any specific library, instead defining REST concepts in generic way.
  The exposed API allows to define REST API endpoints in highly configurable and compile-time-safe way.
- The folder [plugins](./plugins) is the "glue" layer, written to bridge the gap between fully generic API in [model](./model/) layer and actual libraries that can be used for things like running HTTP server and validating data.
  Currently, only [koa.ts](./plugins/koa.ts) and [io-ts.ts](./plugins/io-ts.ts) files have content, as this is just a PoC.

