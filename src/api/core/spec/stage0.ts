import * as core from "../core";
import * as md from "../metadata";
import * as common from "./common";
import { AppEndpointBuilderInitial } from ".";

export const bindNecessaryTypes = <
  TContext,
  TValidationError,
  // eslint-disable-next-line @typescript-eslint/ban-types
>(): AppEndpointBuilderProvider<TContext, TContext, TValidationError, {}> =>
  new AppEndpointBuilderProvider(
    {
      validator: (ctx) => ({ error: "none", data: ctx }),
    },
    {},
  );

export class AppEndpointBuilderProvider<
  TContext,
  TRefinedContext,
  TValidationError,
  TMetadataProviders extends Record<
    string,
    md.MetadataProvider<md.HKTArg, unknown, unknown, unknown, unknown, unknown>
  >,
> {
  public constructor(
    private readonly _contextTransform: core.ContextValidatorSpec<
      TContext,
      TRefinedContext,
      TValidationError
    >,
    private readonly _mdProviders: TMetadataProviders,
  ) {}

  public atURL(fragments: TemplateStringsArray): AppEndpointBuilderInitial<
    TContext,
    TRefinedContext,
    TValidationError,
    {}, // eslint-disable-line @typescript-eslint/ban-types
    core.HttpMethod,
    {
      [P in keyof TMetadataProviders]: ReturnType<
        TMetadataProviders[P]["getBuilder"]
      >;
    }
  >;
  public atURL<TArgs extends [string, ...Array<string>]>(
    fragments: TemplateStringsArray,
    ...args: TArgs
  ): URLDataNames<
    TContext,
    TRefinedContext,
    TValidationError,
    TArgs[number],
    {
      [P in keyof TMetadataProviders]: ReturnType<
        TMetadataProviders[P]["getBuilder"]
      >;
    }
  >;
  public atURL<TArgs extends [string, ...Array<string>]>(
    fragments: TemplateStringsArray,
    ...args: TArgs
  ):
    | AppEndpointBuilderInitial<
        TContext,
        TRefinedContext,
        TValidationError,
        {}, // eslint-disable-line @typescript-eslint/ban-types
        core.HttpMethod,
        {
          [P in keyof TMetadataProviders]: ReturnType<
            TMetadataProviders[P]["getBuilder"]
          >;
        }
      >
    | URLDataNames<
        TContext,
        TRefinedContext,
        TValidationError,
        TArgs[number],
        {
          [P in keyof TMetadataProviders]: ReturnType<
            TMetadataProviders[P]["getBuilder"]
          >;
        }
      > {
    if (args.length > 0) {
      // URL template has arguments -> return URL data validator which allows to build endpoints
      return {
        validateURLData: (validation) => {
          return new AppEndpointBuilderInitial({
            contextTransform: this._contextTransform,
            fragments,
            methods: {},
            // TODO fix this typing (may require extracting this method into class, as anonymous methods with method generic arguments don't behave well)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            metadata: core.transformEntries(this._mdProviders, (md) =>
              md.getBuilder(),
            ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            urlValidation: {
              args,
              validation,
            },
          });
        },
      };
    } else {
      // URL has no arguments -> return builder which can build endpoints without URL validation
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return new AppEndpointBuilderInitial({
        contextTransform: this._contextTransform,
        fragments,
        methods: {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        metadata: core.transformEntries(this._mdProviders, (md) =>
          md.getBuilder(),
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        urlValidation: undefined,
      });
    }
  }

  public refineContext<TNewContext>(
    transform: core.ContextValidatorSpec<
      TRefinedContext,
      TNewContext,
      TValidationError
    >,
    mdArgs: {
      [P in keyof TMetadataProviders]: Parameters<
        TMetadataProviders[P]["withRefinedContext"]
      >[0];
    },
  ): AppEndpointBuilderProvider<
    TContext,
    TNewContext,
    TValidationError,
    TMetadataProviders
  > {
    return new AppEndpointBuilderProvider(
      {
        ...transform,
        validator: (ctx) => {
          const transformed = this._contextTransform.validator(ctx);
          switch (transformed.error) {
            case "none":
              return transform.validator(transformed.data);
            default:
              return transformed;
          }
        },
      },
      core.transformEntries(this._mdProviders, (provider, key) =>
        provider.withRefinedContext(mdArgs[key]),
      ) as TMetadataProviders,
    );
  }

  public withMetadataProvider<
    TMetadataKind extends string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TMetadataProvider extends md.MetadataProvider<any, any, any, any, any, any>,
  >(
    metadataKind: TMetadataKind,
    metadataProvider: TMetadataProvider,
  ): AppEndpointBuilderProvider<
    TContext,
    TRefinedContext,
    TValidationError,
    TMetadataProviders & { [P in TMetadataKind]: TMetadataProvider }
  > {
    return new AppEndpointBuilderProvider(this._contextTransform, {
      ...this._mdProviders,
      [metadataKind]: metadataProvider,
    });
  }

  public getMetadataFinalResult(
    mdArgs: {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProvider<
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _1, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _2, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _3, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer TArg,
        unknown
      >
        ? TArg
        : never;
    },
    endpoints: ReadonlyArray<{
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProvider<
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _1, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer TEndpointMD,
        infer _2, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _3, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _4 // eslint-disable-line @typescript-eslint/no-unused-vars
      >
        ? Array<TEndpointMD>
        : never;
    }>,
  ): {
    [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProvider<
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer _1, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer _2, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer _3, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer _4, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer TResult
    >
      ? TResult
      : never;
  } {
    return core.transformEntries(this._mdProviders, (md, key) =>
      md.createFinalMetadata(
        mdArgs[key],
        endpoints.flatMap((ep) => ep[key]),
      ),
    ) as {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataProvider<
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _1, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _2, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _3, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _4, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer TResult
      >
        ? TResult
        : never;
    };
  }
}

export interface URLDataNames<
  TContext,
  TRefinedContext,
  TValidationError,
  TNames extends string,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
> {
  validateURLData: <
    TValidation extends {
      [P in TNames]: core.URLDataParameterValidatorSpec<
        unknown,
        TValidationError
      >;
    },
  >(
    validation: TValidation,
  ) => AppEndpointBuilderInitial<
    TContext,
    TRefinedContext,
    TValidationError,
    common.EndpointHandlerArgsWithURL<{
      [P in TNames]: core.URLParameterDataType<TValidation[P]["validator"]>;
    }>,
    core.HttpMethod,
    TMetadataProviders
  >;
}
