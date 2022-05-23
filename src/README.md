# Source Code
This folder contains all the source code used in this project.
The [api](./api) folder contains code related to REST API, while [lib](./lib) folder contains code related to business logic.
In case of this sample, this business logic is just about "things" and how to query, create, and connect them.

Notice that business logic folder is not aware of REST API, and is free to utilize whatever typing necessary to best convoy what functions accept, and what they return.

# Entrypoint
The file [index.ts](./index.ts) contains the entrypoint for the sample.
This entrypoint locks in the libraries used - right now they are [io-ts](http://npmjs.org/package/io-ts) for data validation and [koa](http://npmjs.org/package/koa) for running HTTP server and configure its middleware.
If the libraries are decided to be changed, then the code in `index.ts` would need to be changed too, but the business logic layer would remain the same.

The `index.ts` file starts (after `import`s) with definition of `endpointsAsKoaMiddleware` function.
This function uses the "glue" layer in [api/plugins](./api/plugins) folder to parametrize generic code of [api/model](./api/model) to understand concepts specific to `io-ts` and `koa` libraries.
The "glue" layer is passed definitions of REST API endpoints, each specifying how to behave in respect to REST-specific concepts (URL, body, etc), and which business logic functionality to invoke.

The code continues onward to define `middleWareToSetUsernameFromJWTToken` Koa middleware - just semi-dummy function to simulate authenticating the user, to get a feeling on how username authentication could be handled with Koa middleware.

As last code chunk, the Koa application is created, the middleware is configured to it using return values of `endpointsAsKoaMiddleware` and `middleWareToSetUsernameFromJWTToken` functions, and server is started.
When configuring middleware for result of `endpointsAsKoaMiddleware`, the callbacks are registered to the events emitted by Koa middleware helper in [api/plugins/koa.ts](./api/plugins/koa.ts), to demonstrate how logging could be done.
