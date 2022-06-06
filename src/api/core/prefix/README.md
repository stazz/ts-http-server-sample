# Generic REST API Endpoint Specification URL Prefixing
The code in this folder exposes one overloaded function `atPrefix`, which allows to put multiple `AppEndpoint`s defined in [core module](../core) behind one single `AppEndpoint` with given URL prefix.
The URL prefix is specified as string.
The returned `AppEndpoint` will correctly route the request to correct actual handler.

The `atPefix` effectively introduces monoidical-ish behaviour to `AppEndpoint`s.
