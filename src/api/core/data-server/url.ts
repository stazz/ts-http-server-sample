import type * as common from "../data";

export interface URLDataParameterValidatorSpec<TData> {
  regExp: RegExp;
  validator: DataValidatorURL<TData>;
}

export type DataValidatorURL<TData> = common.DataValidator<string, TData>;

export type URLParameterDataType<T> = T extends DataValidatorURL<infer U>
  ? U
  : never;

const DEFAULT_PARAM_REGEXP = /[^/]+/;
export const defaultParameterRegExp = () => new RegExp(DEFAULT_PARAM_REGEXP);
