import * as ep from "../endpoint";
import * as data from "../data-server";
import type * as md from "../metadata";
import type * as common from "./common";
import { AppEndpointBuilderInitial } from ".";

export const bindNecessaryTypes = <TContext, TState>(
  getInitialState: (ctx: TContext) => TState,
): AppEndpointBuilderProvider<
  TContext,
  TContext,
  TState,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  {}
> =>
  new AppEndpointBuilderProvider(
    {
      validator: (ctx) => ({ error: "none", data: ctx }),
      getState: getInitialState,
    },
    {},
  );

// TODO use ContextHKT in these
export class AppEndpointBuilderProvider<
  TContext,
  TRefinedContext,
  TState,
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
  TMetadataProviders extends Record<
    string,
    // We must use 'any' as 2nd parameter, otherwise we won't be able to use AppEndpointBuilderProvider with specific TMetadataProviders type as parameter to functions.
    md.MetadataProvider<
      md.HKTArg,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      unknown,
      unknown,
      TOutputContents,
      TInputContents,
      unknown,
      unknown
    >
  >,
> {
  public constructor(
    private readonly _contextTransform: data.ContextValidatorSpec<
      TContext,
      TRefinedContext,
      TState
    >,
    private readonly _mdProviders: TMetadataProviders,
  ) {}

  public atURL(fragments: TemplateStringsArray): AppEndpointBuilderInitial<
    TContext,
    TRefinedContext,
    TState,
    {}, // eslint-disable-line @typescript-eslint/ban-types
    ep.HttpMethod,
    TOutputContents,
    TInputContents,
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
    TState,
    TArgs[number],
    TOutputContents,
    TInputContents,
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
        TState,
        {}, // eslint-disable-line @typescript-eslint/ban-types
        ep.HttpMethod,
        TOutputContents,
        TInputContents,
        {
          [P in keyof TMetadataProviders]: ReturnType<
            TMetadataProviders[P]["getBuilder"]
          >;
        }
      >
    | URLDataNames<
        TContext,
        TRefinedContext,
        TState,
        TArgs[number],
        TOutputContents,
        TInputContents,
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
            metadata: data.transformEntries(this._mdProviders, (md) =>
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
        metadata: data.transformEntries(this._mdProviders, (md) =>
          md.getBuilder(),
        ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        urlValidation: undefined,
      });
    }
  }

  public refineContext<TNewContext, TNewState>(
    transform: data.ContextValidatorSpec<
      TRefinedContext,
      TNewContext,
      TNewState
    >,
    mdArgs: {
      [P in keyof TMetadataProviders]: Parameters<
        TMetadataProviders[P]["withRefinedContext"]
      >[0];
    },
  ): AppEndpointBuilderProvider<
    TContext,
    TNewContext,
    TNewState,
    TOutputContents,
    TInputContents,
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
      data.transformEntries(this._mdProviders, (provider, key) =>
        provider.withRefinedContext(mdArgs[key]),
      ) as TMetadataProviders,
    );
  }

  public withMetadataProvider<
    TMetadataKind extends string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TMetadataProvider extends md.MetadataProvider<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >,
  >(
    metadataKind: TMetadataKind,
    metadataProvider: TMetadataProvider,
  ): AppEndpointBuilderProvider<
    TContext,
    TRefinedContext,
    TState,
    TOutputContents &
      (TMetadataProvider extends md.MetadataProvider<
        infer _,
        infer _1,
        infer _2,
        infer _4,
        infer TNewOutputContents,
        infer _5,
        infer _6,
        infer _7
      >
        ? TNewOutputContents
        : never),
    TInputContents &
      (TMetadataProvider extends md.MetadataProvider<
        infer _,
        infer _1,
        infer _2,
        infer _4,
        infer _5,
        infer TNewInputContents,
        infer _6,
        infer _7
      >
        ? TNewInputContents
        : never),
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
        infer _4,
        infer _5,
        infer TArg,
        infer _6
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
        infer _4, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _5,
        infer _6
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
      infer _5,
      infer _6,
      infer TResult
    >
      ? TResult
      : never;
  } {
    return data.transformEntries(this._mdProviders, (md, key) =>
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
        infer _5,
        infer _6,
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
  TState,
  TNames extends string,
  TOutputContents extends data.TOutputContentsBase,
  TInputContents extends data.TInputContentsBase,
  TMetadataProviders extends Record<
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
  validateURLData: <
    TValidation extends {
      [P in TNames]: data.URLDataParameterValidatorSpec<unknown>;
    },
  >(
    validation: TValidation,
  ) => AppEndpointBuilderInitial<
    TContext,
    TRefinedContext,
    TState,
    common.EndpointHandlerArgsWithURL<{
      [P in TNames]: data.URLParameterDataType<TValidation[P]["validator"]>;
    }>,
    ep.HttpMethod,
    TOutputContents,
    TInputContents,
    TMetadataProviders
  >;
}
