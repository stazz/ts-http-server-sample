import * as ep from "../endpoint";
import type * as data from "../data-server";
import type * as md from "../metadata";
import type * as state from "./state";
import { AppEndpointBuilderInitial } from ".";

export class AppEndpointBuilder<
  TContext,
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TAllowedMethods extends ep.HttpMethod,
  TMetadataProviders extends Record<
    string,
    // We must use 'any' as 2nd parameter, otherwise we won't be able to use AppEndpointBuilder with specific TMetadataProviders type as parameter to functions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    md.MetadataBuilder<md.HKTArg, any, unknown>
  >,
> extends AppEndpointBuilderInitial<
  TContext,
  TRefinedContext,
  TState,
  TValidationError,
  TArgsURL,
  TAllowedMethods,
  TMetadataProviders
> {
  public createEndpoint(mdArgs: {
    [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer TArg,
      unknown
    >
      ? TArg
      : never;
  }): ep.AppEndpoint<
    TContext,
    TValidationError,
    {
      [P in keyof TMetadataProviders]: TMetadataProviders[P] extends md.MetadataBuilder<
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
        infer TEndpointMD
      >
        ? TEndpointMD
        : never;
    }
  > {
    if (Object.keys(this._state.methods).length > 0) {
      const { urlValidation } = this._state;
      const metadata = constructMDResults(this._state, mdArgs);
      return {
        getRegExpAndHandler: (groupNamePrefix) => ({
          url: urlValidation
            ? buildURLRegExp(
                this._state.fragments,
                urlValidation.args,
                urlValidation.validation,
                groupNamePrefix,
              )
            : new RegExp(ep.escapeRegExp(this._state.fragments.join(""))),
          handler: (method) =>
            checkMethodsForHandler(
              this._state.methods,
              method,
              groupNamePrefix,
            ),
        }),
        getMetadata: (urlPrefix) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return ep.transformEntries(metadata, (md) => [
            md(urlPrefix) as typeof md extends md.SingleEndpointResult<
              infer TEndpointMD
            >
              ? TEndpointMD
              : never,
          ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      };
    } else {
      throw new Error(
        "Please specify at least one method before building endpoint",
      );
    }
  }
}

const checkMethodsForHandler = <
  TContext,
  TValidationError,
  TMetadataProviders extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
>(
  state: {
    [key: string]: state.StaticAppEndpointBuilderSpec<
      TContext,
      TValidationError,
      TMetadataProviders
    >;
  },
  method: ep.HttpMethod,
  groupNamePrefix: string,
): ep.DynamicHandlerResponse<TContext, TValidationError> =>
  method in state
    ? {
        found: "handler" as const,
        handler: state[method].builder(groupNamePrefix),
      }
    : {
        found: "invalid-method" as const,
        allowedMethods: Object.keys(state) as Array<ep.HttpMethod>,
      };

function* getURLItemsInOrder(
  fragments: TemplateStringsArray,
  names: ReadonlyArray<string>,
  validation: Record<
    string,
    data.URLDataParameterValidatorSpec<unknown, unknown>
  >,
) {
  for (const [idx, fragment] of fragments.entries()) {
    yield fragment;
    if (idx < names.length) {
      const name = names[idx];
      yield {
        name,
        validation: validation[name],
      };
    }
  }
}

// For example, from URL string "/api/${id}" and the id parameter adhering to regexp X, build regexp:
// "/api/(?<ep_prefix_id>X)"
// Don't add start/end marks ^/$, since we want to allow prefixing URLs.
const buildURLRegExp = (
  fragments: TemplateStringsArray,
  names: ReadonlyArray<string>,
  validation: Record<
    string,
    data.URLDataParameterValidatorSpec<unknown, unknown>
  >,
  groupNamePrefix: string,
) => {
  return new RegExp(
    Array.from(getURLItemsInOrder(fragments, names, validation)).reduce<string>(
      (currentRegExp, fragmentOrValidation) => {
        return `${currentRegExp}${
          typeof fragmentOrValidation === "string"
            ? ep.escapeRegExp(fragmentOrValidation)
            : `(?<${groupNamePrefix}${fragmentOrValidation.name}>${fragmentOrValidation.validation.regExp.source})`
        }`;
      },
      "",
    ),
  );
};

const constructMDResults = <
  TContext,
  TRefinedContext,
  TState,
  TValidationError,
  TMetadata extends Record<
    string,
    md.MetadataBuilder<md.HKTArg, unknown, unknown>
  >,
>(
  {
    urlValidation,
    ...state
  }: state.AppEndpointBuilderState<
    TContext,
    TRefinedContext,
    TState,
    TValidationError,
    TMetadata
  >,
  mdArgs: {
    [P in keyof TMetadata]: TMetadata[P] extends md.MetadataBuilder<
      infer _, // eslint-disable-line @typescript-eslint/no-unused-vars
      infer TArg,
      unknown
    >
      ? TArg
      : never;
  },
) => {
  const urlSpec = urlValidation
    ? Array.from(
        getURLItemsInOrder(
          state.fragments,
          urlValidation.args,
          urlValidation.validation,
        ),
      ).map((fragmentOrValidation) =>
        typeof fragmentOrValidation === "string"
          ? fragmentOrValidation
          : {
              ...ep.omit(fragmentOrValidation.validation, "validator"),
              name: fragmentOrValidation.name,
            },
      )
    : [...state.fragments];

  return ep.transformEntries(state.metadata, (md, mdKey) =>
    md.getEndpointsMetadata(
      mdArgs[mdKey],
      urlSpec,
      Object.fromEntries(
        Object.entries(state.methods).map(([method, methodInfo]) => {
          return [
            method,
            {
              querySpec: methodInfo.queryValidation,
              inputSpec: methodInfo.inputValidation,
              outputSpec: methodInfo.outputValidation,
              metadataArguments: methodInfo.mdArgs[mdKey],
            },
          ];
        }),
      ),
    ),
  );
};
