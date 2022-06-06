import * as core from "../core";
import * as md from "../metadata";

export interface AppEndpointBuilderState<
  TContext,
  TRefinedContext,
  TValidationError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  fragments: TemplateStringsArray;
  methods: Partial<
    Record<
      core.HttpMethod,
      StaticAppEndpointBuilderSpec<
        TContext,
        TRefinedContext,
        TValidationError,
        TMetadata
      >
    >
  >;
  contextTransform: core.ContextValidatorSpec<
    TContext,
    TRefinedContext,
    TValidationError
  >;
  metadata: TMetadata;
}

export interface AppEndpointBuilderWithURLDataState<
  TContext,
  TRefinedContext,
  TValidationError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> extends AppEndpointBuilderState<
    TContext,
    TRefinedContext,
    TValidationError,
    TMetadata
  > {
  args: ReadonlyArray<string>;
  validation: Record<
    string,
    core.URLDataParameterValidatorSpec<unknown, TValidationError>
  >;
}

export interface StaticAppEndpointBuilderSpec<
  TContext,
  TRefinedContext,
  TBodyError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  builder: StaticAppEndpointBuilder<TContext, TRefinedContext, TBodyError>;
  queryValidation?: Omit<
    core.QueryValidatorSpec<unknown, TBodyError, string>,
    "validator"
  >;
  inputValidation?: Omit<
    core.DataValidatorRequestInputSpec<
      unknown,
      TBodyError,
      Record<string, unknown>
    >,
    "validator"
  >;
  outputValidation: Omit<
    core.DataValidatorResponseOutputSpec<
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

export type StaticAppEndpointBuilder<TContext, TRefinedContext, TBodyError> = (
  groupNamePrefix: string,
  // groups: Record<string, string>,
) => core.StaticAppEndpointHandler<TContext, TRefinedContext, TBodyError>;
