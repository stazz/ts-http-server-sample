import * as data from "../api/core/data";
import * as server from "../api/core/server";
import * as ep from "../api/core/endpoint";
import * as events from "@data-heaving/common";

export const saveAllEventsToArray = (
  array: Array<LoggedEvents>,
  eventNames: Record<
    keyof server.VirtualRequestProcessingEvents<unknown, unknown>,
    undefined
  >,
) =>
  saveEventsToArray(
    array,
    ep.transformEntries(eventNames, () => true),
  );

export const saveEventsToArray = <
  TEventNames extends keyof server.VirtualRequestProcessingEvents<
    unknown,
    unknown
  >,
>(
  array: Array<LoggedEvents<TEventNames>>,
  eventNames: Record<TEventNames, boolean>,
) => {
  const builder = new events.EventEmitterBuilder<
    server.VirtualRequestProcessingEvents<unknown, unknown>
  >();
  for (const [curEventName, include] of Object.entries(eventNames)) {
    if (include) {
      const eventName = curEventName as TEventNames;
      builder.addEventListener(eventName, (arg) => {
        array.push({
          eventName,
          eventData: deepCopySkipFunctions(data.omit(arg, "ctx", "regExp")),
        });
      });
    }
  }

  return builder.createEventEmitter();
};

export type LoggedEvents<
  TKeys extends keyof server.VirtualRequestProcessingEvents<
    unknown,
    unknown
  > = keyof server.VirtualRequestProcessingEvents<unknown, unknown>,
> = {
  eventName: TKeys;
  eventData: EventData<
    server.VirtualRequestProcessingEvents<unknown, unknown>,
    "ctx" | "regExp"
  >;
};

export type EventData<T, TKeys extends string> = {
  [P in keyof T]: StripFunctions<Omit<T[P], TKeys>>;
}[keyof T];

// eslint-disable-next-line @typescript-eslint/ban-types
export type StripFunctions<T> = T extends Function
  ? never
  : T extends Array<infer U>
  ? StripFunctionsArray<U>
  : T extends object
  ? StripFunctionsObject<T>
  : T;
export type StripFunctionsObject<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in KeysOfNonFunctions<T>]: StripFunctions<T[P]>;
};
export type KeysOfNonFunctions<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof T]: T[P] extends Function ? never : P;
}[keyof T];
export type StripFunctionsArray<T> = Array<StripFunctions<T>>;

// JSON.parse(JSON.serialize(...)) converts undefineds to nulls (or omits them?) which may not be what we want...
export const deepCopySkipFunctions = <T>(obj: T): T => {
  let retVal: T;
  if (Array.isArray(obj)) {
    retVal = obj
      .filter(isNotFunction)
      .map((item: unknown) => deepCopySkipFunctions(item)) as unknown as T;
  } else if (typeof obj === "object") {
    retVal = (
      obj === null
        ? null
        : Object.fromEntries(
            Object.entries(obj)
              .filter(([, item]) => isNotFunction(item))
              .map(
                ([key, item]) => [key, deepCopySkipFunctions(item)] as const,
              ),
          )
    ) as T;
  } else {
    retVal = (isNotFunction(obj) ? obj : undefined) as T;
  }
  return retVal;
};

const isNotFunction = (item: unknown) => typeof item !== "function";
