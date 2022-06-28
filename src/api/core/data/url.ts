import type * as common from "./common";

export interface URLDataParameterValidatorSpec<TData, TError> {
  regExp: RegExp;
  validator: DataValidatorURL<TData, TError>;
}

export type DataValidatorURL<TData, TError> = common.DataValidator<
  string,
  TData,
  TError
>;

export type URLParameterDataType<T> = T extends DataValidatorURL<
  infer U,
  unknown
>
  ? U
  : never;

const DEFAULT_PARAM_REGEXP = /[^/]+/;
export const defaultParameterRegExp = () => new RegExp(DEFAULT_PARAM_REGEXP);
