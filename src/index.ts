import * as process from "process";
import type * as serverModuleApi from "./module-api/server";
import type * as restModuleApi from "./module-api/rest";

const main = async (
  host: string,
  port: number,
  server: string,
  dataValidation: string,
) => {
  let exitCode = 1;
  try {
    const allowedServers: Record<
      string,
      { default: serverModuleApi.ServerModule }
    > = {
      express: await import("./server/express"),
      fastify: await import("./server/fastify"),
      koa: await import("./server/koa"),
    };

    const allowedDataValidations: Record<
      string,
      { default: restModuleApi.RESTAPISpecificationModule }
    > = {
      ["io-ts"]: await import("./rest/io-ts"),
      runtypes: await import("./rest/runtypes"),
      zod: await import("./rest/zod"),
    };

    await doThrow(
      allowedServers[server],
      `The first argument must be one of ${Object.keys(allowedServers).join(
        ", ",
      )}.`,
    ).default.startServer(
      host,
      port,
      doThrow(
        allowedDataValidations[dataValidation],
        `The first argument must be one of ${Object.keys(
          allowedDataValidations,
        ).join(", ")}.`,
      ).default.createEndpoints,
    );
    exitCode = 0;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e instanceof Error ? e.message : e);
  }
  if (exitCode === 0) {
    // eslint-disable-next-line no-console
    console.info(
      `Started server "${server}" running on ${host}:${port} using data validation "${dataValidation}".`,
    );
  } else {
    process.exit(exitCode);
  }
};

const doThrow = <T>(value: T | undefined, msg: string) => {
  if (value === undefined) {
    throw new Error(msg);
  }
  return value;
};

const args = process.argv.slice(2);
void main(args[0], parseInt(args[1]), args[2], args[3]);
