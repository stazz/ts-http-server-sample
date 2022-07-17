# Generic REST API Endpoint Specification Core - Protocol Specification
This folder contains small amount of code used by both backend and frontend side when defining HTTP endpoints and what input and output they accept in which format.

- [spec.ts](./spec.ts) defines interfaces that define what protocol specification types may look like.
  The protocol specification rarely implements/references the types, instead relaying more on duck typing to do the match.
  The types are provided as convenience, as they are utilized a lot in various plugins.
- [encoding.ts](./encoding.ts) defines `Encoded` interface, which is meant to be purely virtual interface, used by protocol specifications.
  It provides common way for different protocol specifications to describe how some datum looks like when in transit over HTTP and how it looks during runtime in JS code.
  The file also defines [Higher-Kinded Type](https://www.matechs.com/blog/encoding-hkts-in-typescript-once-again) `HKTEncoded` which is used in [data-client common module](../../data-client/common) to avoid copypasting hundreds of lines of similar code.
