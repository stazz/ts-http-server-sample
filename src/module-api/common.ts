export const USERNAME = "username";

// The state is something that both server and REST API specification must agree on, therefore it is in this shared piece of code.
// It is "Partial" because not all endpoints need to have username.
export type State = Partial<{
  // We reduce a problem of authenticating to a problem of state being of certain shape.
  // In this simple example, that shape is simply username (extracted by previous middleware e.g. from JWT token or by other means).
  // If username is present -> authentication was successful.
  // If username is not present -> authentication was not successful.
  [USERNAME]: string;
}>;
