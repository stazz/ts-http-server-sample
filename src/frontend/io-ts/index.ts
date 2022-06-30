import * as common from "..";
import * as tPlugin from "../../api/data/io-ts";
import * as data from "../../api/core/data";
import * as protocol from "../../protocol";
import * as t from "io-ts";
import * as tt from "io-ts-types";

const thingData = t.type({
  property: tt.UUID,
});
const query = tPlugin.plainValidator(
  t.partial({
    includeDeleted: t.boolean,
  }),
);

const getThing = common
  .bindErrorType<tPlugin.ValidationError>()
  .makeAPICall<protocol.APIGetThing>("GET", {
    method: tPlugin.plainValidator(t.literal("GET")),
    url: data.transitiveDataValidation(
      tPlugin.plainValidator(t.type({ id: tt.UUID })),
      ({ id }) => ({
        error: "none",
        data: `/api/thing/${id}`,
      }),
    ),
    query,
    response: tPlugin.plainValidator(tt.UUID),
  });

void getThing({
  query: {},
  url: {
    id: "moi",
  },
});
