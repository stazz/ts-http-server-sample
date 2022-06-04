# Generic REST API Endpoint Specification API
This folder contains API which allows to define REST API endpoints in library-agnostic and compile-time-safe (aka type-safe) way.
The most important files are:
- [build.ts](./build.ts) defines the core interfaces and methods on defining REST API endpoints, what kind of data is encoded in URL and body, which HTTP methods are OK, etc.
  The code is currently undocumented and the interfaces maybe not the most optimal, but enough for this PoC.
- [prefix.ts](./prefix.ts) defines a way to prefix URLs of a variable amount of REST API endpoints defined by code in [build.ts](./build.ts) and represented by `AppEndpoint` interface.
  The resulting prefixed endpoints appear as one single `AppEndpoint`, allowing to further prefix them, or handle in other way.
