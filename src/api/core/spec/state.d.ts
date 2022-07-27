import * as ep from "../endpoint";
import * as data from "../data-server";
import * as md from "../metadata";

export interface AppEndpointBuilderState<
  TContext,
  TRefinedContext,
  TState,
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<
      md.HKTArg,
      unknown,
      unknown,
      TOutputContents,
      TInputContents
    >
  >,
> {
  fragments: TemplateStringsArray;
  methods: Partial<
    Record<
      ep.HttpMethod,
      StaticAppEndpointBuilderSpec<
        TContext,
        TOutputContents,
        TInputContents,
        TMetadata
      >
    >
  >;
  contextTransform: data.ContextValidatorSpec<
    TContext,
    TRefinedContext,
    TState
  >;
  metadata: TMetadata;
  urlValidation:
    | {
        args: ReadonlyArray<string>;
        validation: Record<string, data.URLDataParameterValidatorSpec<unknown>>;
      }
    | undefined;
}

export interface StaticAppEndpointBuilderSpec<
  TContext,
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<
      md.HKTArg,
      unknown,
      unknown,
      TOutputContents,
      TInputContents
    >
  >,
> {
  builder: StaticAppEndpointBuilder<TContext>;
  queryValidation?: Omit<data.QueryValidatorSpec<unknown, string>, "validator">;
  inputValidation?: Omit<
    data.DataValidatorRequestInputSpec<unknown, TInputContents>,
    "validator"
  >;
  outputValidation: Omit<
    data.DataValidatorResponseOutputSpec<unknown, TOutputContents>,
    "validator"
  >;
  mdArgs: {
    [P in keyof TMetadata]: TMetadata[P] extends md.MetadataBuilder<
      infer TArg,
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer _,
      infer _
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

export type StaticAppEndpointBuilder<TContext> = (
  groupNamePrefix: string,
  // groups: Record<string, string>,
) => ep.StaticAppEndpointHandler<TContext>;
