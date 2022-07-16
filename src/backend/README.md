# Sample Backend Code
This folder contains the code, each implementing setting up backend which matches the endpoints specified in [protocol.ts](../protocol.ts).
Each subfolder locks on the following data validation libraries (note that the code is agnostic to actual HTTP server library used):
- [io-ts](./io-ts) folder contains code for IO-TS library,
- [runtypes](./runtypes) folder contains code for Runtypes library, and
- [zod](./zod) folder contains code for Zod library.
