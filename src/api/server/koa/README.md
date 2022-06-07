# Generic REST API Endpoint Specification HTTP Server Implementations
This folder contains code which implements handling the HTTP requests for endpoints specified by [core](../core/core) module (`AppEndpoint` interface).
It does so by utilizing API exposed by [Koa](https://koajs.com) library.

The exported functions are the following:
- `validateContextState` to create validator for `state` of Koa Context, and possibility to specify custom status code if validation fails.
  For example, `username` property missing from the state would indicate that previous Koa middleware could not authenticate properly -> the return code would be `403` for those `AppEndpoint`s requiring authentication.
- `koaMiddlewareFactory` to create factory function to produce Koa middleware.
  This middleware will handle the HTTP requests as routing them to given `AppEndpoint`s given to `koaMiddlewareFactory`.
  The returned factory function takes one optional parameter, which can include the various handlers for events occurred within the middleware (e.g. for logging purposes).