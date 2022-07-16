# Generic REST API Endpoint Specification HTTP Server Implementations - ExpressJS
This folder contains code which implements handling the HTTP requests for endpoints specified by [core](../core/core) module (`AppEndpoint` interface).
It does so by utilizing API exposed by [ExpressJS](https://expressjs.com) library.

The exported functions are the following:
- `validateContextState` to create validator for `state` of Koa Context, and possibility to specify custom status code if validation fails.
  For example, `username` property missing from the state would indicate that previous Koa middleware could not authenticate properly -> the return code would be `403` for those `AppEndpoint`s requiring authentication.
- `getStateFromContext` to expose uniform (in respect to [ExpressJS](../express) and [Fastify](../fastify) modules) APIs to get the state from the context.
- `createMiddleware` to create Koa middleware, which will handle the HTTP requests as routing them to given `AppEndpoint`s given to `createMiddleware`.
  It accepts optional [EventEmitter](https://github.com/DataHeaving/common/blob/develop/common/src/events.ts#L114) which it will use to emit the events related to handling the HTTP requests.
