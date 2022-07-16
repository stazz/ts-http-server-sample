import * as t from "zod";

export type ValidationError = Array<t.ZodError<unknown>>;

export const getHumanReadableErrorMessage = (errors: ValidationError) =>
  errors.map((e) => e.message).join("\n");

export const exceptionAsValidationError = (
  input: unknown, // TODO maybe make ValidationError include optional 'value' property?
  exception: unknown,
): ValidationError => [
  t.ZodError.create([
    {
      code: "custom",
      path: [""],
      message: `${exception}`,
    },
  ]),
];
