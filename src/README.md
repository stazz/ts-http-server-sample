# Source Code
This folder contains all the source code used in this sample.
The source code is further decomposed into the following folders:
- [api](./api) folder contains code which would be eventually encapsulated as independant NPM libraries,
- [lib](./lib) folder contains code which is unaware of REST API concepts and is domain-specific,
- [rest](./rest) folder contains code which implements REST API of this sample, using one data validation framework at a time,
- [server](./server) folder contains code which implements REST API of this sample, using one HTTP server framework at a time,
- [module-api](./module-api) folder contains code which defines shape for modules within [rest](./rest) and [server](./server) folders,
- [logging.ts](./logging.ts) file contains code which logs the various REST API-specific events, and is agnostic to the server or data validation framework in use,
- [index.ts](./index.ts) file contains entrypoint for this sample, which loads the specified server and data validation plugins, and runs the HTTP server with that combination.
