import * as common from "../common";
import * as tPlugin from "../../data/runtypes";
import * as t from "runtypes";

export const createAPICallFactory = (
  callHttpEndpoint: common.CallHTTPEndpoint,
) =>
  common
    .createAPICallFactory<tPlugin.HKTEncoded>(callHttpEndpoint)
    .withUndefinedValidator(tPlugin.plainValidator(t.Undefined));
