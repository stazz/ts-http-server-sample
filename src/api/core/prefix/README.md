# Generic REST API Endpoint Specification URL Prefixing
The code in this folder exposes one overloaded function `atPrefix`, which allows to put multiple `AppEndpoint`s defined in [core module](../core) behind one single `AppEndpoint` with given URL prefix.
The URL prefix is specified as string.
The returned `AppEndpoint` will correctly route the request to correct actual handler.

The `atPefix` effectively introduces monoidical-ish behaviour to `AppEndpoint`s.

Notice that prefixed `AppEndpoint` still returns exactly *one* RegExp object, that can be used to match the URL pathname.
This one object will then contain enough information for prefixed `AppEndpoint` to identify which actual endpoint to invoke.
