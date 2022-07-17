import * as common from "../common";
import * as tPlugin from "../../data/zod";
import * as t from "zod";

export const createAPICallFactory = (
  callHttpEndpoint: common.CallHTTPEndpoint,
) =>
  common
    .createAPICallFactory<tPlugin.HKTEncoded>(callHttpEndpoint)
    .withUndefinedValidator(tPlugin.plainValidator(t.undefined()));
