import * as process from "process";
import * as utils from "./utils";
import * as logging from "./logging";

const main = async (
  host: string,
  port: number,
  server: string,
  dataValidation: string,
) => {
  let exitCode = 1;
  try {
    // Load all supported servers and data validations
    const { allowedServers, allowedDataValidations } =
      utils.loadServersAndDataValidations();

    // Create server, throw if not one of the supported ones
    const instance = (
      await doThrow(
        allowedServers[server],
        `The first argument must be one of ${Object.keys(allowedServers).join(
          ", ",
        )}.`,
      )
    ).default.createServer({
      createEndpoints: (
        await doThrow(
          allowedDataValidations[dataValidation],
          `The first argument must be one of ${Object.keys(
            allowedDataValidations,
          ).join(", ")}.`,
        )
      ).default.createEndpoints,
      createEvents: ({ getMethodAndUrl }) =>
        logging
          .logServerEvents(
            getMethodAndUrl,
            ({ username }) =>
              `(user: ${username === undefined ? "none" : `"${username}"`})`,
          )
          .createEventEmitter(),
      tryGetUsername: utils.tryGetUsernameFromBasicAuth("secret", "secret"),
    });

    // Start server
    await utils.listenAsync(instance, host, port);

    // Signal that there has been no error
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
    // Notice: in this case, no process.exit is called, but server is let to be running on the background
  } else {
    // There was an error -> force process to exit, in case there is still something async running in the background
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
