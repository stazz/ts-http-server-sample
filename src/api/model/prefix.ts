import * as utils from "./utils";
import * as build from "./build";

export function atPrefix<TValidationError, TContext>(
  prefix: string,
  ...endpoints: Array<build.AppEndpoint<TContext, TValidationError>>
): build.AppEndpoint<
  TContext,
  TValidationError,
  unknown,
  build.DynamicHandlerGetter<TContext, TValidationError, unknown>
>;
export function atPrefix<TValidationError, TContext>(
  prefix: string,
  regexpGroupNamePrefix: string,
  ...endpoints: Array<build.AppEndpoint<TContext, TValidationError>>
): build.AppEndpoint<
  TContext,
  TValidationError,
  unknown,
  build.DynamicHandlerGetter<TContext, TValidationError, unknown>
>;
export function atPrefix<TValidationError, TContext>(
  prefix: string,
  endpointOrGroupNamePrefix:
    | build.AppEndpoint<TContext, TValidationError>
    | string
    | undefined,
  ...endpoints: Array<build.AppEndpoint<TContext, TValidationError>>
): build.AppEndpoint<
  TContext,
  TValidationError,
  unknown,
  build.DynamicHandlerGetter<TContext, TValidationError, unknown>
> {
  const allEndpoints =
    typeof endpointOrGroupNamePrefix === "string" || !endpointOrGroupNamePrefix
      ? endpoints
      : [endpointOrGroupNamePrefix, ...endpoints];
  return {
    methods: Array.from(
      new Set(allEndpoints.flatMap(({ methods }) => methods)).values(),
    ),
    getRegExpAndHandler: (groupNamePrefix) => {
      const { builtEndpoints, regExp } = buildEndpoints(
        allEndpoints,
        groupNamePrefix.length > 0
          ? `${groupNamePrefix}${prefix.replaceAll("/", "")}_`
          : undefined,
      );
      return {
        url: new RegExp(`${utils.escapeRegExp(prefix)}(${regExp.source})`),
        handler: (method, groups) => {
          const matchingHandler = findFirstMatching(
            builtEndpoints,
            ({ regExpGroupName, handler, methods }) => {
              if (groups[regExpGroupName] !== undefined) {
                return methods.indexOf(method) >= 0
                  ? typeof handler === "function"
                    ? handler(method, groups)
                    : { found: "handler" as const, handler }
                  : {
                      found: "invalid-method" as const,
                      allowedMethods: [...methods],
                    };
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
  };
}

const makeEndpointRegExpGroupName = (prefix: string, idx: number) =>
  `${prefix}${idx}`;

const buildEndpoints = <TContext, TValidationError>(
  endpoints: ReadonlyArray<build.AppEndpoint<TContext, TValidationError>>,
  regExpGroupNamePrefix?: string,
) => {
  const isTopLevel = !regExpGroupNamePrefix;
  const groupNamePrefix = isTopLevel ? "e_" : regExpGroupNamePrefix;
  const builtEndpointInfo = endpoints.map(
    ({ methods, getRegExpAndHandler }, idx) => {
      const regExpGroupName = makeEndpointRegExpGroupName(groupNamePrefix, idx);
      return {
        methods,
        regExpGroupName,
        builtEndpoint: getRegExpAndHandler(`${regExpGroupName}_`),
      };
    },
  );

  const getNewRegExpSource: (source: string) => string = isTopLevel
    ? (source) => `^${source}`
    : (source) => source;

  return {
    builtEndpoints: builtEndpointInfo.map(
      ({ methods, regExpGroupName, builtEndpoint }) => ({
        methods,
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
