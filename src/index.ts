import * as process from "process";

const main = async (suffix: string) => {
  await import(`./index-${suffix}`);
};

void main(process.argv[2]);
