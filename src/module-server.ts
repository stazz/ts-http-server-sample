import type * as restApi from "./module-rest-api";

export { State } from "./module-rest-api";

export interface ServerModule {
  startServer: (
    host: string,
    port: number,
    createEndpoints: restApi.RESTAPISpecificationModule["createEndpoints"],
  ) => Promise<void>;
}
