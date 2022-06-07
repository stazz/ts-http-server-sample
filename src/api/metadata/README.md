# Generic REST API Endpoint Specification Metadata
This folder contains modules which implement the metadata layer specified by [metadata](../core/metadata) module.
Each module locks in to some specific data validation library, and adds the "glue" between the core abstractions and actual library API.

There are currently modules implementing data validation for the following frameworks:
- [OpenAPI](./openapi) folder contains implementation for [OpenAPI format](https://swagger.io/specification).
