import * as ep from "../endpoint";
import * as data from "../data-server";
import * as md from "../metadata";

export interface AppEndpointBuilderState<
  TContext,
  TRefinedContext,
  TState,
  TValidationError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  fragments: TemplateStringsArray;
  methods: Partial<
    Record<
      ep.HttpMethod,
      StaticAppEndpointBuilderSpec<TContext, TValidationError, TMetadata>
    >
  >;
  contextTransform: data.ContextValidatorSpec<
    TContext,
    TRefinedContext,
    TState,
    TValidationError
  >;
  metadata: TMetadata;
  urlValidation:
    | {
        args: ReadonlyArray<string>;
        validation: Record<
          string,
          data.URLDataParameterValidatorSpec<unknown, TValidationError>
        >;
      }
    | undefined;
}

export interface StaticAppEndpointBuilderSpec<
  TContext,
  TBodyError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  builder: StaticAppEndpointBuilder<TContext, TBodyError>;
  queryValidation?: Omit<
    data.QueryValidatorSpec<unknown, string, TBodyError>,
    "validator"
  >;
  inputValidation?: Omit<
    data.DataValidatorRequestInputSpec<
      unknown,
      TBodyError,
      Record<string, unknown>
    >,
    "validator"
  >;
  outputValidation: Omit<
    data.DataValidatorResponseOutputSpec<
      unknown,
      TBodyError,
      Record<string, unknown>
    >,
    "validator"
  >;
  mdArgs: {
    [P in keyof TMetadata]: TMetadata[P] extends md.MetadataBuilder<
      infer TArg,
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer _ // eslint-disable-line @typescript-eslint/no-unused-vars
    >
      ? md.Kind<
          TArg,
          Record<string, unknown>,
          Record<string, unknown>,
          Record<string, unknown>,
          Record<string, unknown>
        >
      : never;
  };
}

export type StaticAppEndpointBuilder<TContext, TBodyError> = (
  groupNamePrefix: string,
  // groups: Record<string, string>,
) => ep.StaticAppEndpointHandler<TContext, TBodyError>;
