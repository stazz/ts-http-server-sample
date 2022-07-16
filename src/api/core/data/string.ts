import * as common from "./common";

export type StringParameterTransform<TData, TError> = common.DataValidator<
  string,
  TData,
  TError
>;
