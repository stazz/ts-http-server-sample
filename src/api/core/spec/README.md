# Generic REST API Endpoint Specification Core - Builder
This folder contains code for building the `AppEndpoint` defined in [endpoint module](../endpoint/).
In order to maximize both compile-time safety, and avoiding specifying generic arguments explicitly, a [fluent builder pattern](https://medium.com/@martinstm/fluent-builder-pattern-c-4ac39fafcb0b) is utilized to let developer define one aspect of REST API at a time, without storing intermediate results in unnecessary variables.
The entrypoint is in [stage0.ts](./stage0.ts), where everything starts by binding some necessary types via `bindNecessaryTypes` function.

The code is structured as following:
- [stage0.ts](./stage0.ts) contains entrypoint for starting building REST API endpoints, with definition for `bindNecessaryTypes`, and its return value, `AppEndpointBuilderProvider`.
  The return types for `AppEndpointBuilderProvider` lead directly, or indirectly via `URLDataNames`, to types in next stage.
- [stage1.ts](./stage1.ts) contains one class `AppEndpointBuilderInitial`, which allows to further progress to next stage by specifying the HTTP method and optional URL query validation.
- [stage2.ts](./stage2.ts) contains class `AppEndpointBuilderForMethods` for methods which don't generally accept bodies (e.g. `GET`, while HTTP standard beind vague about it, almost all browsers and servers assume `GET` requests have no body), and `AppEndpointBuilderForMethodsAndBody` for method accepting bodies.
  These classes allow defining callback to invoke to handle the request, validation for output of the callback, and metadata-specific arguments.
  The `AppEndpointBuilderForMethodsAndBody` allows also to provide validator for HTTP body.
- [stage3.ts](./stage3.ts) contains class `AppEndpointBuilder`, which then allows to build the final `AppEndpoint` defined in [endpoint module](../endpoint/).
  This class also allows to further specify method and optional URL query for methods not yet specified, and to go back to previous stage again.
  This way, multiple methods can be handled via same URL.
- [common.ts](./common.ts) contains few exported common types.
- [state.d.ts](./state.d.ts) contains non-exported types to handle internal state of classes involved in various stages.

Notice that in order to avoid circular dependencies (class defined in [stage3.ts](./stage3.ts) extends class defined in [stage1.ts](./stage1.ts)), we import the classes used in stage files via [index.ts](./index.ts).
This is the proposed solution of [this Medium post](https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de).

See the [metadata module](../metadata) to learn more about the metadata in REST API specification.