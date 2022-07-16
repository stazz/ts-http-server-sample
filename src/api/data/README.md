# Generic REST API Endpoint Specification Data Validation for both Backends and Frontends
This folder contains modules which implement the data validation layer specified by [core module](../core/data).
Each module locks in to some specific data validation library, and adds the "glue" between the core abstractions and actual library API.

There are currently modules implementing data validation for the following frameworks:
- [io-ts](./io-ts) folder contains implementation for IO-TS library,
- [runtypes](./runtypes) folder contains implementation for Runtypes library, and
- [zod](./zod) folder contains implementation for Zod library.
