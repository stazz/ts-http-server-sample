# Generic REST API Endpoint Specification Server Utilities
The code in this folder contains commonly used utility methods, which are used by implementations running REST API based on `AppEndpoint`s defined in [core module](../core).
The following functions are exported:
- `checkURLPathNameForHandler` to check whether any `AppEndpoint` matches given URL pathname,
- `checkMethodForHandler` to check whether any `AppEndpoint` matches the given HTTP method,
- `checkContextForHandler` to check whether current context object matches the required context of matched endpoint,
- `checkURLParametersForHandler` to validate the parameters in the URL pathname against the one required by matched endpoint,
- `checkQueryForHandler` to validate the query parameters in the URL against the one required by matched endpoint,
- `checkBodyForHandler` to validate the HTTP body against the one required by matched endpoint, and
- `invokeHandler` to invoke the handler for the endpoint.
