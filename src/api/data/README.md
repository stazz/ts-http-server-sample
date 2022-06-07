# Generic REST API Endpoint Specification Data Validation
This folder contains modules which implement the data validation layer specified by [core](../core/core) module.
Each module locks in to some specific data validation library, and adds the "glue" between the core abstractions and actual library API.

There are currently modules implementing data validation for the following frameworks:
- [io-ts](./io-ts) folder contains implementation for IO-TS library,
- [runtypes](./runtypes) folder will contain implementation for Runtypes library at some point, and
- [zod](./zod) folder will contain implementation for Zod library at some point.
