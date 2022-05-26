# Sample Project on Unopinionated and Typesafe HTTP Server
This Git repository contains a sample TypeScript project to demonstrate one way of writing HTTP server exposing a set of configurable REST API endpoints.
Each endpoint has its own URL/body validation, and output transforms.

## Experimenting
To get quick hands-on experience, feel free to clone this Git repo and open the project in your favourite IDE.

So far, the IDE that has been tested is VSCode/VSCodium, having [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) installed, and with the following file at path `.vscode/settings.json`:
```json
{
  "typescript.tsdk": "node_modules\\typescript\\lib",
  "editor.formatOnSave": true,
  "eslint.format.enable": true,
  "[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[scss]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  }
}
```

This project uses Yarn as package manager, so as very first step, run:
```sh
yarn install --frozen-lockfile
```

Good starting point is file `src/index.ts`.
The following things are good experiments to kick off full project exploration:
- On line `50` ( ``urlBuilder.atURL`/${"id"}` ``), try change the literal `"id"` into other literal, like `"id_typoed"`.
  Observe immediate compile-time errors.
- On same line, try to change the literal `"id"` into e.g. number `42` or even reference to some string variable.
  Observe immediate compile-time errors.
- On line `53` ( `id: idInURL,` ), try change the property name from `id` to something else, like `id_typoed`.
  Observe immediate compile-time errors.
- On line `56` ( `.withoutBody(` ), try change the invoked method name to `withBody`.
  Observe immediate compile-time errors (because `"GET"` handlers can not specify body).
- On line `58` ( `({ id }) => functionality.queryThing(id),` ), try to change the property name of the argument (`{ id }` into something else, like `{ id_typoed }`).
  Observe immediate compile-time errors.
- On line `60` ( `tPlugin.outputValidator(t.string)` ), try change the output type `t.string` to something else, like `t.number`, so that the line becomes `tPlugin.outputValidator(t.number)`.
  Observe immediate compile-time errors.
- Feel free to try similar things with other endpoints, and other places in the code.
  All folder in [source code folder](src) also contain `README.md` files for documentation.

Before delving deeper into the code, try starting the HTTP server with command `yarn run server`, and after seeing message `Koa server started`, try the following `curl` commands:
- `curl -v http://localhost:3000/api/thing/00000000-0000-0000-0000-000000000000` to test endpoint in `src/lib/query.ts`.
  There should be no errors, and the returned value should be same ID as in URL.
- `curl -v -X PUT -d'{"property":"00000000-0000-0000-0000-000000000000"}' http://localhost:3000/api/thing` to test endpoint in `src/lib/create.ts`.
  There should be no errors, and the returned value should be same as supplied body.
- `curl -v -X POST -d'{"anotherThingId": "00000000-0000-0000-0000-000000000000"}' http://localhost:3000/api/thing/00000000-0000-0000-0000-000000000000/connectToAnotherThing` to test endpoint in `src/lib/connect.ts`.
  There should be no errors, and the returned value should be `{"connected":true,"connectedAt":"<current time in ISO format>"}`.
- `curl -v http://localhost:3000/doc` to test endpoint specified inline in `src/index.ts`.
  There should be no errors, and the returned value should be `"This is our documentation"`.
- `curl -v http://localhost:3000/non-existing` to test how situation is handled when there are no suitable endpoints for URL.
  The response code should be `404`, and Koa server should have logged an error to stdout.
- `curl -v -X POST -d'{"property":"00000000-0000-0000-0000-000000000000"}' http://localhost:3000/api/thing` to test correct endpoint, but wrong method.
  The response code should be `405` and `Allowed` header should contain value `PUT`.
  Koa server should have logged an error to stdout.
- `curl -v -X PUT -d'{"invalid_property":"00000000-0000-0000-0000-000000000000"}' http://localhost:3000/api/thing` to test correct endpoint, but wrong body.
  The response code should be `422`, and Koa server should have logged an error to stdout.

This should be quite good introduction to the project.
Feel free to explore subfolders in `src` folder, read included `README.md` files, and play around with code to see which changes invoke immediate IDE compiler response.

Notice - there are barely any documentation so far, and all of the unit tests are missing.
Furthermore, URL query parameter validation is also missing.
I did this whole sample in a matter of some hours during weekend - if it gets past PoC, the lacking features can be added.

## Design Principles and How They Are Achieved
This chapter talks on higher level about the motivation behind this sample, and the features that using this sample hopefully exposes.
All the features mentioned strive for one goal: *Ability to write robust and trustworthy code in most efficient manner*.

What does this fancy statement mean?
The core message is that features of programming language should be utilized in *maximized* way, in order to *minimize* the gap between conceptual specification (e.g. requirements document) and technical specification (e.g. types in TypeScript).
The *robust*, *efficient*, and *trustworthy* terms here are more about writing correctly functioning code once and getting feedback on errors (logical ones, typos, etc) as soon as possible, than writing large amounts of LOC or using convoluted data structures or control flow.

This is how this project achieves the goal:
- The first principle is the most important of them all, and it relates closely to developer experience (and thus, how efficent, robust, etc the code will actually be).
  The language chosen is **compile-time typed**, allowing to define rules for data structures and function inputs and inputs.
  Furthermore, as much as possible of parameters for specifying the rules (in this case, ruleset for defining customizable REST APIs) are pushed to compilation-time phase; one example of this are the `TArgs` type parameter of `atURL` function in `src/api/model/build.ts` captures the endpoint URL structure at compile-time (assuming the arguments are compile-time constants, as they almost always are in this case).
  On general level, following this principle allows to push down reaction time for bugs and errors from **days** in case of "discovered in production", past **hours** in case of "discovered in pipeline", and **down to almost-realtime** in case of "discovered by IDE compiler".
- The various type definitions and functions in `src/api/model` folder are designed to be "foolproof" in order to allow only correct way of using them.
  For example, the `withBody` and `withoutBody` methods of `AppEndpointBuilder` interface in `src/api/model/build.ts` clearly indicate how the endpoind will behave in regards to HTTP body, as opposed to having generic approach of one method returning one generic (base) type.
  Furthermore, these methods further adher to previously mentioned principle, as they convey the expectations of endpoint towards the HTTP body to the compiler (via different return types), allowing further compile-time error checking.
- The type definitions and functions in `src/api/model` folder try to be as un-opinionated as possible - none of the files has any external dependencies apart from TS standard library.
  This agnosticism allows to shift the decisions and control about library decisions higher in the architectural layers, thus widening the selection of libraries to use, up to the highest level of design.
- The type definitions and functions in `src/api/model` are also minimal, to avoid maintenance burden.
  The core file `src/api/model/build.ts` is jut a bit over 300 LOC, written in prettified format.
- The minimalism and agnosticism allow for better *class decoupling*:
    - The http-server/data-validation library dependencies are introduced in `src/api/plugins` folder as a glue between dependenless things in `src/api/model` folder, and actual libraries one decides to use.
    - The actual code which *does* the business-specific things is in `lib` folder and its subfolders.
      It is **not aware of REST API** or much other things than the things it cares about, and thus it is **easily unit-testable**, and also **easily invokable** if e.g. published as a library to be consumed by 3rd party.
    - The entrypoint file `src/index.ts` is acting as highest architectural layer, seeing all of libraries that will actually be used (`koa` and `io-ts`, in this case), the generic REST API functionality in `src/api/model` folder, and the glue between generic REST API functionality and `koa` and `io-ts` library in `src/api/plugins` folder.
      It has absolute control over both the REST API endpoints and which libraries are used, and change to those things will result changes only in that file (assuming the glue in `src/api/plugins` is available for libraries in question).
- Last but not least - the project strives to achieve good runtime performance.
  Part of that is already done by keeping things minimalistic and doing things in simple way when it is possible.
  Furthermore, some additional runtime performance benefit is achieved by e.g. composing all URL matching RegExps into one RegExp, so URL is ran through exactly one RegExp once per request (instead of each endpoint having separate RegExp, and matching endpoint would be searched by running URL through RegExps one by one).


# Architecture Layers of This Project
On a higher level, this project architectural layers can be described as following:
- The *entrypoint* file `src/index.ts` is highest layer, and it is directly depending on *business logic* and *glue layer*.
- The *business logic* layer is in `src/lib` directory, and it is directly depending on busines-related libraries and such (e.g. DB lib, but not visible in this sample just yet).
  It is **not depending** on things like HTTP protcols, validating its own input/output, etc (however, it can be validating e.g. output from DB queries, via some ORM library or something else).
- The *glue layer* is in `src/api/plugins` directory, and it is directly depending on *generic REST API layer* and *libraries*.
  Notice that currently that folder only has support for `koa` and `io-ts`, as this is just a PoC.
- The *generic REST API layer* is in `src/api/model` directory, and does not have any library dependencies.
  It allows to describe REST API structure and behaviour in generic, yet fully compile-time-safe way.
- The *libraries* are defined in `package.json` and right now include `koa` and `io-ts`, and their peer dependencies.
