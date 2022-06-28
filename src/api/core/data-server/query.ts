import type * as q from "querystring";
import type * as common from "../data";

export interface QueryValidatorSpec<TQuery, TValidationError> {
  validator: QueryValidator<TQuery, TValidationError>;
  isParameterRequired: Record<string, boolean>;
}

export type QueryValidator<TQuery, TValidationError> =
  | QueryValidatorForString<TQuery, TValidationError>
  | QueryValidatorForObject<TQuery, TValidationError>;

export interface QueryValidatorForString<TQuery, TValidationError> {
  query: "string";
  validator: common.DataValidator<string, TQuery, TValidationError>;
}

export interface QueryValidatorForObject<TQuery, TValidationError> {
  query: "object";
  validator: common.DataValidator<q.ParsedUrlQuery, TQuery, TValidationError>;
}
