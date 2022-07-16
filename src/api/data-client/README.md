# Generic REST API Endpoint Specification Data Validation for Frontends
This folder contains modules which implement the data validation layer specified by [core module](../core/data) as to be used in frontend side.
There is one module containing data validation library -agnostic code, and the rest of the modules each locks in to some specific data validation library, and adds the "glue" between the core abstractions and actual library API.

The common data module is in [common](./common) folder.
The remaining modules implement data validation for the following frameworks:
- [io-ts](./io-ts) folder contains implementation for IO-TS library,
- [runtypes](./runtypes) folder contains implementation for Runtypes library, and
- [zod](./zod) folder contains implementation for Zod library.
