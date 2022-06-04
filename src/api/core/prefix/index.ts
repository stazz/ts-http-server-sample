import * as core from "../core";

export function atPrefix<
  TValidationError,
  TRefinedContext,
  TContext,
  TMetadata extends Record<string, unknown>,
>(
  prefix: string,
  ...endpoints: Array<
    core.AppEndpoint<TContext, TRefinedContext, TValidationError, TMetadata>
  >
): core.AppEndpoint<TContext, TRefinedContext, TValidationError, TMetadata>;
export function atPrefix<
  TValidationError,
  TRefinedContext,
  TContext,
  TMetadata extends Record<string, unknown>,
>(
  prefix: string,
  regexpGroupNamePrefix: string,
  ...endpoints: Array<
    core.AppEndpoint<TContext, TRefinedContext, TValidationError, TMetadata>
  >
): core.AppEndpoint<TContext, TRefinedContext, TValidationError, TMetadata>;
export function atPrefix<
  TValidationError,
  TRefinedContext,
  TContext,
  TMetadata extends Record<string, unknown>,
>(
  prefix: string,
  endpointOrGroupNamePrefix:
    | core.AppEndpoint<TContext, TRefinedContext, TValidationError, TMetadata>
    | string
    | undefined,
  ...endpoints: Array<
    core.AppEndpoint<TContext, TRefinedContext, TValidationError, TMetadata>
  >
): core.AppEndpoint<TContext, TRefinedContext, TValidationError, TMetadata> {
  const allEndpoints =
    typeof endpointOrGroupNamePrefix === "string" || !endpointOrGroupNamePrefix
      ? endpoints
      : [endpointOrGroupNamePrefix, ...endpoints];
  return {
    getRegExpAndHandler: (groupNamePrefix) => {
      const { builtEndpoints, regExp } = buildEndpoints(
        allEndpoints,
        groupNamePrefix.length > 0
          ? `${groupNamePrefix}${prefix.replaceAll("/", "")}_`
          : undefined,
      );
      return {
        url: new RegExp(`${core.escapeRegExp(prefix)}(${regExp.source})`),
        handler: (method, groups) => {
          const matchingHandler = findFirstMatching(
            builtEndpoints,
            ({ regExpGroupName, handler }) => {
              if (groups[regExpGroupName] !== undefined) {
                return handler(method, groups);
              }
            },
          );
          // Matching handler should really never be undefined at this point, but let's failsafe anyway
          return (
            matchingHandler ?? {
              found: "invalid-method",
              allowedMethods: [],
            }
          );
        },
      };
    },
    getMetadata: (urlPrefix) => {
      return (
        allEndpoints.reduce((curResult, { getMetadata }) => {
          const mdDic = getMetadata(`${urlPrefix}${prefix}`);
          if (curResult === undefined) {
            curResult = core.transformEntries(mdDic, () => []);
          }
          for (const key of Object.keys(mdDic)) {
            curResult[key].push(...mdDic[key]);
          }
          return curResult;
        }, undefined as undefined | { [P in keyof TMetadata]: Array<TMetadata[P]> }) ??
        ({} as { [P in keyof TMetadata]: Array<TMetadata[P]> })
      );
    },
  };
}

const makeEndpointRegExpGroupName = (prefix: string, idx: number) =>
  `${prefix}${idx}`;

const buildEndpoints = <
  TContext,
  TRefinedContext,
  TValidationError,
  TMetadata extends Record<string, unknown>,
>(
  endpoints: ReadonlyArray<
    core.AppEndpoint<TContext, TRefinedContext, TValidationError, TMetadata>
  >,
  regExpGroupNamePrefix?: string,
) => {
  const isTopLevel = !regExpGroupNamePrefix;
  const groupNamePrefix = isTopLevel ? "e_" : regExpGroupNamePrefix;
  const builtEndpointInfo = endpoints.map(({ getRegExpAndHandler }, idx) => {
    const regExpGroupName = makeEndpointRegExpGroupName(groupNamePrefix, idx);
    return {
      regExpGroupName,
      builtEndpoint: getRegExpAndHandler(`${regExpGroupName}_`),
    };
  });

  const getNewRegExpSource: (source: string) => string = isTopLevel
    ? (source) => `^${source}`
    : (source) => source;

  return {
    builtEndpoints: builtEndpointInfo.map(
      ({ regExpGroupName, builtEndpoint }) => ({
        regExpGroupName,
        handler: builtEndpoint.handler,
      }),
    ),
    regExp: new RegExp(
      builtEndpointInfo
        .map(
          ({ regExpGroupName, builtEndpoint: { url } }) =>
            // Notice that we don't know for certain whether our regexp should match from start to end.
            // However, we do know, that it must match to the end.
            // Otherwise, we will get false matches for parents paths.
            `(?<${regExpGroupName}>${getNewRegExpSource(url.source)}$)`,
        )
        .join("|"),
    ),
  };
};

function findFirstMatching<T, U>(
  iterable: Iterable<T>,
  tryMap: (item: T) => U | undefined,
) {
  for (const item of iterable) {
    const maybeValue = tryMap(item);
    if (maybeValue !== undefined) {
      return maybeValue;
    }
  }
  return undefined;
}
