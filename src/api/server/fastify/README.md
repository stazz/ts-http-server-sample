# Generic REST API Endpoint Specification HTTP Server Implementations - Fastify
This folder contains code which implements handling the HTTP requests for endpoints specified by [core](../core/core) module (`AppEndpoint` interface).
It does so by utilizing API exposed by [Fastify](https://www.fastify.io) library.

The exported functions are the following:
- `validateContextState` to create validator for `state` of Koa Context, and possibility to specify custom status code if validation fails.
  For example, `username` property missing from the state would indicate that previous Koa middleware could not authenticate properly -> the return code would be `403` for those `AppEndpoint`s requiring authentication.
- `getStateFromContext` to expose uniform (in respect to [ExpressJS](../express) and [Koa](../koa) modules) APIs to get the state from the context.
- `createRoute` to create Fastify route, which will handle the HTTP requests as routing them to given `AppEndpoint`s given to `createRoute`.
  It accepts optional [EventEmitter](https://github.com/DataHeaving/common/blob/develop/common/src/events.ts#L114) which it will use to emit the events related to handling the HTTP requests.
- `registerRouteToFastifyInstance` utility method to handle all necessary ceremonies related to register the route created by `createRoute` to Fastify instance in a correct way.
