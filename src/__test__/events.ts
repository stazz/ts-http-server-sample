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
          eventData: deepCopyAssumeSimpleThings(
            data.omit(arg, "ctx", "regExp"),
          ),
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
  eventData: Omit<
    server.VirtualRequestProcessingEvents<unknown, unknown>[TKeys],
    "ctx" | "regExp"
  >;
};

// JSON.parse(JSON.serialize(...)) converts undefineds to nulls (or omits them?) which may not be what we want...
const deepCopyAssumeSimpleThings = <T>(obj: T): T => {
  let retVal: T;
  if (Array.isArray(obj)) {
    retVal = obj.map((item: unknown) =>
      deepCopyAssumeSimpleThings(item),
    ) as unknown as T;
  } else if (typeof obj === "object") {
    retVal = (
      obj === null
        ? null
        : ep.transformEntries(obj as Record<string, unknown>, (item) =>
            deepCopyAssumeSimpleThings(item),
          )
    ) as T;
  } else {
    retVal = obj;
  }
  return retVal;
};
