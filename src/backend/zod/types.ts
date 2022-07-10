// Import generic REST-related things
import type * as ep from "../../api/core/endpoint";
import type * as spec from "../../api/core/spec";

// Import plugin for OpenAPI metadata
import type * as openapi from "../../api/metadata/openapi";

// Zod as data runtime validator
import type * as t from "zod";
// Import plugin for Zod
import type * as tPlugin from "../../api/data-server/zod";
import type * as protocol from "../../protocol";
import type * as common from "../../module-api/common";

export type TMetadataProviders = { openapi: openapi.OpenAPIMetadataBuilder };

export type AuthenticatedState = common.MakeRequired<common.State>;

export type IDValidation = t.ZodEffects<t.ZodString>;

export type EndpointArgs = {
  idRegex: RegExp;
  idInBody: IDValidation;
  data: {
    thing: t.ZodObject<{ property: IDValidation }>;
  };
};

export type EndpointSpec<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFunctionality extends (...args: any) => any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TState extends {} = Partial<AuthenticatedState>,
> = (
  args: EndpointArgs,
) => TProtocolSpec["method"] extends ep.HttpMethodWithoutBody
  ? MakeSpecWithoutBody<TProtocolSpec, TFunctionality, TState>
  : TProtocolSpec extends protocol.ProtocolSpecRequestBody<unknown>
  ? MakeSpecWithBody<TProtocolSpec, TFunctionality, TState>
  : MakeSpecWithoutBody<TProtocolSpec, TFunctionality, TState>;

export type MakeSpecWithoutBody<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFunctionality extends (...args: any) => any,
  TState extends Record<string, unknown> = Partial<AuthenticatedState>,
> = TProtocolSpec extends protocol.ProtocolSpecQuery<infer TQuery>
  ? spec.BatchSpecificationWithQueryWithoutBody<
      unknown,
      TState,
      tPlugin.ValidationError,
      TProtocolSpec extends protocol.ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      protocol.GetRuntime<TQuery>,
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        protocol.GetEncoded<TProtocolSpec["responseBody"]>
      >
    >
  : spec.BatchSpecificationWithoutQueryWithoutBody<
      unknown,
      TState,
      tPlugin.ValidationError,
      TProtocolSpec extends protocol.ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        protocol.GetEncoded<TProtocolSpec["responseBody"]>
      >
    >;

export type MakeSpecWithBody<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
    protocol.ProtocolSpecRequestBody<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFunctionality extends (...args: any) => any,
  TState extends Record<string, unknown> = Partial<AuthenticatedState>,
> = TProtocolSpec extends protocol.ProtocolSpecQuery<infer TQuery>
  ? spec.BatchSpecificationWithQueryWithBody<
      unknown,
      TState,
      tPlugin.ValidationError,
      TProtocolSpec extends protocol.ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      protocol.GetRuntime<TQuery>,
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        protocol.GetEncoded<TProtocolSpec["responseBody"]>
      >,
      protocol.GetRuntime<TProtocolSpec["requestBody"]>,
      tPlugin.InputValidatorSpec<
        protocol.GetRuntime<TProtocolSpec["requestBody"]>
      >
    >
  : spec.BatchSpecificationWithoutQueryWithBody<
      unknown,
      TState,
      tPlugin.ValidationError,
      TProtocolSpec extends protocol.ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        protocol.GetEncoded<TProtocolSpec["responseBody"]>
      >,
      protocol.GetRuntime<TProtocolSpec["requestBody"]>,
      tPlugin.InputValidatorSpec<
        protocol.GetRuntime<TProtocolSpec["requestBody"]>
      >
    >;
