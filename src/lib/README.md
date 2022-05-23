# Business Logic Layer
This folder contains code which simulates business logic.
Right now, everything is just about "things" in [thing](./thing) folder.

Notice that code in business logic layer is not aware of REST-specific things like URLs, query parameters, body, headers, etc.
Instead, the business logic layer is agnostic on how it is called - by REST API, or directly from other library, or in some other way.
