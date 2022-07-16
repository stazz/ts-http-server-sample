# Sample Frontend Code - IO-TS
This folder contains the code, which implements setting up frontend which matches the endpoints specified in [protocol.ts](../../protocol.ts).
It does so by locking to [IO-TS](https://github.com/gcanti/io-ts) library as data validation library, and utilizing frontend-suitable generic and IO-TS-specific modules of the [core](../../api/).

- `createBackend` function in [backend.ts](./backend.ts) demonstrates how to create an object encapsulating all endpoints provided by backend.
- `invokeRestAPI` function in [index.ts](./index.ts) demonstrates how to actually invoke the backend endpoints.
