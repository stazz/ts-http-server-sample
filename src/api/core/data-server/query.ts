import type * as q from "querystring";
import type * as common from "../data";

export interface QueryValidatorSpec<TQuery, TQueryKeys extends string> {
  validator: QueryValidator<TQuery>;
  isParameterRequired: Record<TQueryKeys, boolean>;
}

export type QueryValidator<TQuery> =
  | QueryValidatorForString<TQuery>
  | QueryValidatorForObject<TQuery>;

export interface QueryValidatorForString<TQuery> {
  query: "string";
  validator: common.DataValidator<string, TQuery>;
}

export interface QueryValidatorForObject<TQuery> {
  query: "object";
  validator: common.DataValidator<q.ParsedUrlQuery, TQuery>;
}
