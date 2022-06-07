# Generic REST API Endpoint Specification HTTP Server Implementations
This folder contains modules which implement handling the HTTP requests for endpoints specified by [core](../core/core) module (`AppEndpoint` interface).
Each module locks in to some specific HTTP server library, and adds the "glue" between the core abstractions and actual library API.

There are currently modules implementing server handling for the following frameworks:
- [express](./express) folder will contain implementation for [ExpressJS](https://expressjs.com),
- [fastify](./fastify) folder will contain implementation for [Fastify](https://www.fastify.io), and
- [koa](./koa) folder contains implementation for [Koa](https://koajs.com).
