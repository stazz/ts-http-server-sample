import type * as restApi from "./rest";

export { State } from "./rest";

export interface ServerModule {
  startServer: (
    host: string,
    port: number,
    createEndpoints: restApi.RESTAPISpecificationModule["createEndpoints"],
  ) => Promise<void>;
}
