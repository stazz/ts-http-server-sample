import * as common from "./common";

export type StringParameterTransform<TData> = common.DataValidator<
  string,
  TData
>;
