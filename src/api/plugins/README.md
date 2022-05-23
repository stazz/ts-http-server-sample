# The Bridge Between Generic REST API and Concrete Libraries
This folder contains code which bridges the gap ("glues") between Generic REST API defined in [model](../model/) folder, and actual libraries to be used when running REST API server.
Currently, because this is demo PoC, only two files have content:
- [io-ts.ts](./io-ts.ts) exposes types and functions which are related to data validation portion of Generic REST API, and delegates the validation to [io-ts](https://www.npmjs.com/package/io-ts) library.
- [koa.ts](./koa.ts) exposes `koaMiddlewareFactory` function, which allows converting the `AppEndpoint`s of Generic REST API into [koa](https://www.npmjs.com/package/koa) middleware.

The files `express.ts` and `fastify.ts` currently have no content.
