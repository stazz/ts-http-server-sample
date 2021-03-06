# Sample Project on Unopinionated and Typesafe HTTP Protocol Specification
This Git repository contains a sample TypeScript project to demonstrate one way of writing HTTP backend and frontent, using configurable REST API endpoints.
Since this is a sample, it is by no means a complete product, or final representation of such.

Instead, it envisions a way on how REST APIs could be defined in TypeScript code, centralizing the various aspects (input/output validation, endpoint metadata, etc) into one place (as per DRY principle), and pushing as much checks as possible down to be compile-time checks.
This enables *<1second reaction time by IDE* to any typos, or otherwise erroneus code put into the REST API specification.

## Experimenting
To get quick hands-on experience, feel free to clone this Git repo as a first step.
To install the dependencies, and boot up a combination of HTTP server + data validation framework, use the following:
```sh
cd <this git repo root>
./scripts/run-server.sh <server library> <data validation library>
```
The *server library* can be one of the following:
- `koa`,
- `express`, or
- `fastify`.

The *data validation library* can be one of the following:
- `io-ts`,
- `runtypes`, or
- `zod`.

The `scripts/run-server.sh` script above uses Docker to install dependencies and execute the sample.
If the Docker is missing from your system and you do not wish to install it, the equivalent of the above is achieved with these commands:
```sh
yarn install --frozen-lockfile
yarn run server <server library> <data validation library>
```

Finally, open the project in your favourite IDE.

So far, the IDE that has been tested is VSCode/VSCodium, having [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) installed, and with the following file at path `.vscode/settings.json`:
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
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

Once the repository is opened in IDE, good starting point is file `src/protocol.d.ts`.
This file contains the code which fully specifies the REST API - its endpoints, the input they accept, the output they produce, etc.
Both backend and frontend sample code ultimately depends on this one file - this file can be thought as a heart of this sample.
Notice that since this file is shared between both BE and FE, it has minimal set of dependencies.

The following things are good experiments to do in `src/protocol.d.ts` to kick off full project exploration.
Notice that when the list talks about observing compile-time errors in certain folders, it might require to open few files in those folders in the IDE on first time, for the IDE to show those errors.
- On line `22` ( `id: ID`), try change the literal `id` into other literal, like `id_typoed`.
  Observe immediate compile-time errors in both `src/backend` and `src/frontend` folders.
- On same line, try to change the type `ID` into e.g. `number`.
  Observe immediate compile-time errors in both `src/backend` and `src/frontend` folders.
- Insert new line after line `28` (`responseBody: string;`).
  Make the line content the following: `headers: { Authorization: "auth" };`, thus making that endpoint requiring authentication.
  Observe immediate compile-time errors in both `src/backend` and `src/frontend` folders.
- On line `48` (`headers: { Authorization: "auth" };`), try to remove the whole line, thus making that API endpoint unauthenticated.
  Observe immediate compile-time errors in both `src/backend` and `src/frontend` folders.
- Feel free to try similar things with other endpoints, and other places in the code.
  All folder in [source code folder](src) also contain `README.md` files for documentation.


Before delving deeper into the code, try starting the HTTP server with command `./scripts/run-server.sh koa io-ts`, and wait for seeing message `Started server "koa" running on 0.0.0.0:3000 using data validation "io-ts".`.
Once seeing that message, run in another terminal window `./scripts/swagger-ui.sh`, and wait for message `/docker-entrypoint.sh: Configuration complete; ready for start up`.
Open your browser and navigate to `http://localhost` and notice Swagger UI is running.
Compare the API definitions to the ones in [protocol.d.ts](./src/protocol.d.ts) - the API definitions were generated from code which ultimately depends on the interfaces in [protocol.d.ts](./src/protocol.d.ts).

Notice that authenticated endpoints miss from this one.
Swagger UI needs to be configured to send credentials when accessing `/api-md` endpoint (or use slightly different technique for launching UI) for the authenticated endpoint specification to become available.

The various `.spec.ts` files in [src/__test__](./src/__test__) folder can be explored to see what kind of behaviour is expected of BE.

This should be quite good introduction to the project.
Feel free to explore subfolders in `src` folder, read included `README.md` files, and play around with code to see which changes invoke immediate IDE compiler response.
It is good idea to explore `backend` and `frontend` subfolders of the `src` first, as they give concrete examples on how the REST API can be implemented by backend, and how it is invoked by frontend.
Other subfolders contain more generic things, which are easier to understand after first familiarizing oneself with the BE/FE -specific concrete code.
The [file containing tests for all servers and data validation frameworks](./src/__test__/index.spec.ts) is also very good place to see how things work on a higher level.

## Design Principles and How They Are Achieved
This chapter talks on higher level about the motivation behind this sample, and the features that using this sample hopefully exposes.
All the features mentioned strive for one goal: *Ability to write robust and trustworthy code in most efficient manner*.

What does this fancy statement mean?
The core message is that features of programming language should be utilized in *maximized* way, in order to *minimize* the gap between conceptual specification (e.g. requirements document) and technical specification (e.g. types in TypeScript).
The *robust*, *efficient*, and *trustworthy* terms here are more about writing correctly functioning code once and getting feedback on errors (logical ones, typos, etc) as soon as possible, than writing large amounts of LOC or using convoluted data structures or control flow.

This is how this project achieves the goal:
- The first principle is the most important of them all, and it relates closely to developer experience (and thus, how efficent, robust, etc the code will actually be).
  The language chosen is **compile-time typed**, allowing to define rules for data structures and function inputs and inputs.
  Furthermore, as much as possible of parameters for specifying the rules (in this case, ruleset for defining customizable REST APIs) are pushed to compilation-time phase; one example of this are the types in `src/protocol.d.ts`, from which stem almost everything else non-generic (not in `src/api` folder).
  On general level, following this principle allows to push down reaction time for bugs and errors from **days** in case of "discovered in production", past **hours** in case of "discovered in pipeline", and **down to almost-realtime** in case of "discovered by IDE compiler".
- The various type definitions and functions in `src/backend/*/types.ts` and `src/frontend/*/backend.ts` folders are designed to be "foolproof" in order to allow only correct way of using them.
  For example, the `EndpointSpec` types in  `src/backend/*/types.ts` files make separation on whether they allow request body definition, depending on the HTTP method of the endpoint.
  This allows checking of sanity of endpoint specification already at compile-time.
- The type definitions and functions in `src/api/core` folder try to be as un-opinionated as possible - none of the files has any external dependencies apart from TS standard library.
  This agnosticism allows to shift the decisions and control about library decisions higher in the architectural layers, thus widening the selection of libraries to use, up to the highest level of design.
- The type definitions and functions in `src/api/core` are also minimal, to avoid maintenance burden.
- The minimalism and agnosticism allow for better *class decoupling*:
    - The http-server/data-validation library dependencies are introduced in `src/api/data`, `src/api/metadata` and `src/api/server` folders as a glue between dependenless things in `src/api/core` folder, and actual libraries one decides to use.
    - The actual code which *does* the business-specific things is in `lib` folder and its subfolders.
      It is **not aware of REST API** or much other things than the things it cares about, and thus it is **easily unit-testable**, and also **easily invokable** if e.g. published as a library to be consumed by 3rd party.
    - The files placed directly in `src` folder are acting as highest architectural layer, seeing all of libraries that will actually be used.
      It has absolute control over both the REST API endpoints and which libraries are used, and change to those things will result changes only in these files.
- Last but not least - the project strives to achieve good runtime performance.
  Part of that is already done by keeping things minimalistic and doing things in simple way when it is possible.
  Furthermore, some additional runtime performance benefit is achieved by e.g. composing all URL matching RegExps into one RegExp, so URL is ran through exactly one RegExp once per request (instead of each endpoint having separate RegExp, and matching endpoint would be searched by running URL through RegExps one by one).


# Architecture Layers of This Project
On a higher level, this project architectural layers can be described as following:
- The *entrypoint* file `src/index.ts` and REST API specification file `src/protocol.d.ts` are inside the highest layer, and the layer is directly depending on *business logic* and *glue layer*.
- The *business logic* layer is in `src/lib` directory, and it is directly depending on busines-related libraries and such (e.g. DB lib, but not visible in this sample just yet).
  It is **not depending** on things like HTTP protcols, validating its own input/output, etc (however, it can be validating e.g. output from DB queries, via some ORM library or something else).
- The *generic REST API layer* is in `src/api/core` directory, further decomposed into smaller modules, and does not have any library dependencies.
  It allows to describe REST API structure and behaviour in generic, yet fully compile-time-safe way.
- The *glue layer* is in the subdirectories of `src/api` directory, except `core` one, and it is directly depending on *generic REST API layer* and *libraries*.
  Notice that currently that folder only has support for `koa` and `io-ts`, as this is just a PoC.
- The *backend demonstration layer* is in `src/backend/<data validation library>` folders, duplicated for each data validation library.
  The layer demonstrates how to implement the backend using certain data validation library, and the specification in `src/protocol.d.ts`.
  Notice that the layer is **agnostic to the HTTP server library used**.
- The *frontend demonstration layer* is in `src/frontend/<data validation library>` folders, duplicated for each data validation library.
  The layer demonstrates how to invoke backend API using certain data validation library, and the specification in `src/protocol.d.ts`.
  Notice that the layer is **agnostic to HTTP invocation library used**.
- The *libraries* are defined in `package.json` and right now include all necessary dependencies to run all the possible server and data validation library combinations.

# Current known limitations and shortcomings
- The full URL needs to be specified both in `src/backend/<data validation library>` and `src/frontend/<data validation library>` code, and as such, does not adher to DRY principle.
  This needs further investigated how feasible it is to make URL specification more DRY.
- Adding new optional query parameters to protocol types does not cause compilation errors.
  Not sure if that is a feature or a bug.
- The automatic OpenAPI JSON schema specification generation from validation objects is not yet implemented.
  Thus the generated OpenAPI document right now is very short stub.
  This will be addresed by #3.