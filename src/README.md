# Source Code
This folder contains all the source code used in this sample.
The idea is that everything in [api](./api) folder would be eventually encapsulated as NPM libraries, while everything in [lib](./lib) folder and in [index.ts](./index.ts) and [rest-endpoints.ts](./rest-endpoints.ts) files would be domain-specific code.

# Entrypoint
The file [index.ts](./index.ts) contains the entrypoint for the sample.
This entrypoint locks in the libraries used - right now they are [io-ts](http://npmjs.org/package/io-ts) for data validation and [koa](http://npmjs.org/package/koa) for running HTTP server and configure its middleware.
If the libraries are decided to be changed, then the code in `index.ts` would need to be changed too, but the business logic layer would remain the same.

The `index.ts` file starts (after `import`s) with call to `koaMiddlewareFactory` function.
This function is in the Koa Server "glue" layer in [api/server/koa](./api/server/koa) folder to parametrize generic code of [api/core](./api/core) to understand concepts specific to `koa` library.
The code in `index.ts` further continues to define simplistic credential validation Koa middleware, and then starts the Koa server.

The argument to `koaMiddlewareFactory` function comes from result of invocation of function in [rest-endpoints.ts](./rest-endpoints.ts) file.
This file contains the full REST API specification: the endpoints, their URL and query and body inputs, and the outputs.
For all of this, OpenAPI metadata additional information is defined.
The code to specify these things could be put in multiple files, however, for this sample purpose, it is put in one file.

# Further Code
The [api](./api) folder contains code related to REST API, while [lib](./lib) folder contains code related to business logic.
In case of this sample, this business logic is just about "things" and how to query, create, and connect them.

Notice that business logic folder is not aware of REST API, and is free to utilize whatever typing necessary to best convoy what functions accept, and what they return.
