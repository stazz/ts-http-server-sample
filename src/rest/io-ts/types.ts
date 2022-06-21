// Import generic REST-related things
import type * as core from "../../api/core/core";
import type * as spec from "../../api/core/spec";

// Import plugin for OpenAPI metadata
import type * as openapi from "../../api/metadata/openapi";

// IO-TS as data runtime validator
import type * as t from "io-ts";
// Import plugin for IO-TS
import type * as tPlugin from "../../api/data/io-ts";
import type * as common from "../../module-api/common";

export type TMetadataProviders = { openapi: openapi.OpenAPIMetadataBuilder };

export type AuthenticatedState = common.MakeRequired<common.State>;

export type EndpointArgs = {
  idRegex: RegExp;
  idInBody: t.BrandC<t.StringC, unknown>;
  data: {
    thing: t.TypeC<{ property: t.BrandC<t.StringC, unknown> }>;
  };
};

export interface ProtocolSpecCore<TMethod extends string, TOutput> {
  method: TMethod;
  responseBody: TOutput;
}

export interface ProtocolSpecURL<TURLData extends Record<string, unknown>> {
  url: TURLData;
}

export interface ProtocolSpecQuery<TQueryData extends Record<string, unknown>> {
  query: TQueryData;
}

export interface ProtocolSpecRequestBody<TInput> {
  requestBody: TInput;
}

export type EndpointSpec<
  TProtocolSpec extends ProtocolSpecCore<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFunctionality extends (...args: any) => any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TState extends {} = Partial<AuthenticatedState>,
> = (
  args: EndpointArgs,
) => TProtocolSpec["method"] extends core.HttpMethodWithoutBody
  ? MakeSpecWithoutBody<TProtocolSpec, TFunctionality, TState>
  : TProtocolSpec extends ProtocolSpecRequestBody<unknown>
  ? MakeSpecWithBody<TProtocolSpec, TFunctionality, TState>
  : MakeSpecWithoutBody<TProtocolSpec, TFunctionality, TState>;

export type MakeSpecWithoutBody<
  TProtocolSpec extends ProtocolSpecCore<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFunctionality extends (...args: any) => any,
  TState extends Record<string, unknown> = Partial<AuthenticatedState>,
> = TProtocolSpec extends ProtocolSpecQuery<infer TQuery>
  ? spec.BatchSpecificationWithQueryWithoutBody<
      unknown,
      TState,
      tPlugin.ValidationError,
      TProtocolSpec extends ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      TQuery,
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        TProtocolSpec["responseBody"]
      >
    >
  : spec.BatchSpecificationWithoutQueryWithoutBody<
      unknown,
      TState,
      tPlugin.ValidationError,
      TProtocolSpec extends ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        TProtocolSpec["responseBody"]
      >
    >;

export type MakeSpecWithBody<
  TProtocolSpec extends ProtocolSpecCore<string, unknown> &
    ProtocolSpecRequestBody<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFunctionality extends (...args: any) => any,
  TState extends Record<string, unknown> = Partial<AuthenticatedState>,
> = TProtocolSpec extends ProtocolSpecQuery<infer TQuery>
  ? spec.BatchSpecificationWithQueryWithBody<
      unknown,
      TState,
      tPlugin.ValidationError,
      TProtocolSpec extends ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      TQuery,
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        TProtocolSpec["responseBody"]
      >,
      TProtocolSpec["requestBody"],
      tPlugin.InputValidatorSpec<TProtocolSpec["requestBody"]>
    >
  : spec.BatchSpecificationWithoutQueryWithBody<
      unknown,
      TState,
      tPlugin.ValidationError,
      TProtocolSpec extends ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        TProtocolSpec["responseBody"]
      >,
      TProtocolSpec["requestBody"],
      tPlugin.InputValidatorSpec<TProtocolSpec["requestBody"]>
    >;
