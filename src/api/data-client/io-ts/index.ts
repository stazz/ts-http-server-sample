import * as common from "../common";
import * as tPlugin from "../../data/io-ts";
import * as t from "io-ts";

export const createAPICallFactory = (
  callHttpEndpoint: common.CallHTTPEndpoint,
) =>
  common
    .createAPICallFactory<tPlugin.HKTEncoded>(callHttpEndpoint)
    .withUndefinedValidator(tPlugin.plainValidator(t.undefined));
