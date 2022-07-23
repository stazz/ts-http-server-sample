// Import generic REST-related things
import type * as ep from "../../api/core/endpoint";
import type * as spec from "../../api/core/spec";
import type * as protocol from "../../api/core/protocol";

// Import plugin for OpenAPI metadata
import type * as openapi from "../../api/metadata/openapi";

// Runtypes as data runtime validator
import type * as t from "runtypes";
// Import plugin for Runtypes
import type * as tPluginCommon from "../../api/data/io-ts";
import type * as tPlugin from "../../api/data-server/runtypes";
import type * as common from "../../module-api/common";

export type TMetadataProviders = {
  openapi: openapi.OpenAPIMetadataBuilder<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tPlugin.OutputValidatorSpec<any, any>,
    tPlugin.InputValidatorSpec<any>
  >;
};

export type AuthenticatedState = common.MakeRequired<common.State>;

export type IDValidation = t.Brand<"ID", t.Constraint<t.String>>;

export type EndpointArgs = {
  idRegex: RegExp;
  idInBody: IDValidation;
  data: {
    thing: t.Record<{ property: IDValidation }, false>;
  };
};

export type EndpointSpec<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFunctionality extends (...args: any) => any,
> = (
  args: EndpointArgs,
) => TProtocolSpec["method"] extends ep.HttpMethodWithoutBody
  ? MakeSpecWithoutBody<TProtocolSpec, TFunctionality>
  : TProtocolSpec extends protocol.ProtocolSpecRequestBody<unknown>
  ? MakeSpecWithBody<TProtocolSpec, TFunctionality>
  : MakeSpecWithoutBody<TProtocolSpec, TFunctionality>;

export type MakeSpecWithoutBody<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFunctionality extends (...args: any) => any,
> = TProtocolSpec extends protocol.ProtocolSpecQuery<infer TQuery>
  ? spec.BatchSpecificationWithQueryWithoutBody<
      unknown,
      GetProtocolState<TProtocolSpec>,
      TProtocolSpec extends protocol.ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      protocol.RuntimeOf<TQuery>,
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        tPluginCommon.GetEncoded<TProtocolSpec["responseBody"]>
      >
    >
  : spec.BatchSpecificationWithoutQueryWithoutBody<
      unknown,
      GetProtocolState<TProtocolSpec>,
      TProtocolSpec extends protocol.ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        tPluginCommon.GetEncoded<TProtocolSpec["responseBody"]>
      >
    >;

export type MakeSpecWithBody<
  TProtocolSpec extends protocol.ProtocolSpecCore<string, unknown> &
    protocol.ProtocolSpecRequestBody<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFunctionality extends (...args: any) => any,
> = TProtocolSpec extends protocol.ProtocolSpecQuery<infer TQuery>
  ? spec.BatchSpecificationWithQueryWithBody<
      unknown,
      GetProtocolState<TProtocolSpec>,
      TProtocolSpec extends protocol.ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      protocol.RuntimeOf<TQuery>,
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        tPluginCommon.GetEncoded<TProtocolSpec["responseBody"]>
      >,
      protocol.RuntimeOf<TProtocolSpec["requestBody"]>,
      tPlugin.InputValidatorSpec<
        protocol.RuntimeOf<TProtocolSpec["requestBody"]>
      >
    >
  : spec.BatchSpecificationWithoutQueryWithBody<
      unknown,
      GetProtocolState<TProtocolSpec>,
      TProtocolSpec extends protocol.ProtocolSpecURL<infer TURLData>
        ? spec.EndpointHandlerArgsWithURL<TURLData>
        : // eslint-disable-next-line @typescript-eslint/ban-types
          {},
      TMetadataProviders,
      TProtocolSpec["method"],
      ReturnType<TFunctionality>,
      tPlugin.OutputValidatorSpec<
        ReturnType<TFunctionality>,
        tPluginCommon.GetEncoded<TProtocolSpec["responseBody"]>
      >,
      protocol.RuntimeOf<TProtocolSpec["requestBody"]>,
      tPlugin.InputValidatorSpec<
        protocol.RuntimeOf<TProtocolSpec["requestBody"]>
      >
    >;

export type GetProtocolState<TProtocolSpec> =
  TProtocolSpec extends protocol.ProtocolSpecHeaders<Record<string, "auth">>
    ? AuthenticatedState
    : common.State;
