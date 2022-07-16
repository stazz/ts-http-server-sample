# Generic REST API Endpoint Specification Core - Metadata
The code in this folder defines types and one utility class for passing metadata during REST API endpoint building, typically done via [spec module](../spec/).
The type uses the pattern described [higher-kinded type encoding in TypeScript](https://www.matechs.com/blog/encoding-hkts-in-typescript-once-again), involving `this` type and type intersections.
This allows for the types in [spec module](../spec) to pass type arguments to something that is type argument itself.

The utility class `InitialMetadataProviderClass` exported by this module encapsulates the most typical behaviour of providers implementing functionality described by other types.
To see concrete example on how the types are implemented by provider, see [OpenAPI module](../../metadata/openapi).
To see how the provider can be used, and metadata specified, see [rest-endpoints.ts](../../../rest-endpoints.ts) file.
