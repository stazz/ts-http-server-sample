import * as ep from "../endpoint";
import * as data from "../data-server";
import * as md from "../metadata";

export interface AppEndpointBuilderState<
  TContext,
  TRefinedContext,
  TState,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  fragments: TemplateStringsArray;
  methods: Partial<
    Record<ep.HttpMethod, StaticAppEndpointBuilderSpec<TContext, TMetadata>>
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
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  builder: StaticAppEndpointBuilder<TContext>;
  queryValidation?: Omit<data.QueryValidatorSpec<unknown, string>, "validator">;
  inputValidation?: Omit<
    data.DataValidatorRequestInputSpec<unknown, Record<string, unknown>>,
    "validator"
  >;
  outputValidation: Omit<
    data.DataValidatorResponseOutputSpec<unknown, Record<string, unknown>>,
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

export type StaticAppEndpointBuilder<TContext> = (
  groupNamePrefix: string,
  // groups: Record<string, string>,
) => ep.StaticAppEndpointHandler<TContext>;
