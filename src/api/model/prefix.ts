import * as utils from "./utils";
import * as ep from "./endpoint";

export function atPrefix<TValidationError, TContext>(
  prefix: string,
  ...endpoints: Array<ep.AppEndpoint<TContext, TValidationError>>
): ep.AppEndpoint<TContext, TValidationError>;
export function atPrefix<TValidationError, TContext>(
  prefix: string,
  regexpGroupNamePrefix: string,
  ...endpoints: Array<ep.AppEndpoint<TContext, TValidationError>>
): ep.AppEndpoint<TContext, TValidationError>;
export function atPrefix<TValidationError, TContext>(
  prefix: string,
  endpointOrGroupNamePrefix:
    | ep.AppEndpoint<TContext, TValidationError>
    | string
    | undefined,
  ...endpoints: Array<ep.AppEndpoint<TContext, TValidationError>>
): ep.AppEndpoint<TContext, TValidationError> {
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
        url: new RegExp(`${utils.escapeRegExp(prefix)}(${regExp.source})`),
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
  };
}

const makeEndpointRegExpGroupName = (prefix: string, idx: number) =>
  `${prefix}${idx}`;

const buildEndpoints = <TContext, TValidationError>(
  endpoints: ReadonlyArray<ep.AppEndpoint<TContext, TValidationError>>,
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
