import * as core from "../../core/core";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import * as rawbody from "raw-body";
import type * as q from "querystring";

// We only support json things for io-ts validation.
const CONTENT_TYPE = "application/json" as const;

export type ValidationError = t.Errors;
export type Decoder<TData, TInput = unknown> = t.Decoder<TInput, TData> & {
  _tag: string;
};
export type ValidatorSpec = {
  [CONTENT_TYPE]: Decoder<unknown>;
};
export type Encoder<TOutput, TSerialized> = t.Encoder<TOutput, TSerialized> & {
  _tag: string;
};
export type OutputValidatorSpec = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [CONTENT_TYPE]: Encoder<any, unknown>;
};

export const urlParameter = <T extends Decoder<unknown> & t.Mixed>(
  validation: StringParameterTransform<T>,
  regExp?: RegExp,
): core.URLDataParameterValidatorSpec<t.TypeOf<T>, ValidationError> => ({
  regExp: regExp ?? core.defaultParameterRegExp(),
  validator: createValidatorForStringParameter(validation),
});

export const queryValidator = <
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: StringParameterTransform<t.Mixed>;
  },
>({
  required,
  optional,
  validation,
}: QueryValidatorPropertySpec<
  TRequired,
  TOptional,
  TValidation
>): core.QueryValidatorSpec<
  { [P in TRequired]: t.TypeOf<TValidation[P]["validation"]> } & {
    [P in TOptional]?: t.TypeOf<TValidation[P]["validation"]>;
  },
  ValidationError
> => {
  const initialValidator = plainValidator(
    t.exact(
      t.intersection([
        t.type(Object.fromEntries(required.map((r) => [r, t.string]))),
        t.partial(Object.fromEntries(optional.map((o) => [o, t.string]))),
      ]),
    ),
  );
  const paramValidators = Object.fromEntries(
    Object.entries(
      validation as Record<string, StringParameterTransform<t.Mixed>>,
    ).map(([key, paramValidation]) => [
      key,
      createValidatorForStringParameter(paramValidation),
    ]),
  );
  const finalValidator = core.transitiveDataValidation(
    initialValidator,
    (data) => {
      const finalResult: Record<string, unknown> = {};
      const errors: ValidationError = [];
      for (const [key, dataItemIter] of Object.entries(data)) {
        const paramValidationResult = paramValidators[key](dataItemIter);
        switch (paramValidationResult.error) {
          case "none":
            finalResult[key] = paramValidationResult.data;
            break;
          default:
            errors.push(...paramValidationResult.errorInfo);
        }
      }
      return errors.length > 0
        ? {
            error: "error",
            errorInfo: errors,
          }
        : {
            error: "none",
            data: finalResult,
          };
    },
  );
  return {
    validator: {
      query: "object",
      validator: finalValidator as core.DataValidator<
        q.ParsedUrlQuery,
        { [P in TRequired]: t.TypeOf<TValidation[P]["validation"]> } & {
          [P in TOptional]?: t.TypeOf<TValidation[P]["validation"]>;
        },
        ValidationError
      >,
    },
    isParameterRequired: Object.fromEntries(
      required
        .map<[string, boolean]>((r) => [r, true])
        .concat(optional.map((o) => [o, false])),
    ),
  };
};

export interface QueryValidatorPropertySpec<
  TRequired extends string,
  TOptional extends string,
  TValidation extends {
    [P in TRequired | TOptional]: StringParameterTransform<t.Mixed>;
  },
> {
  required: ReadonlyArray<TRequired>;
  optional: ReadonlyArray<TOptional>;
  validation: TValidation;
}

export interface StringParameterTransform<
  TValidation extends t.Mixed,
  // TStringValidation extends Decoder<string> & t.Mixed = t.StringType,
> {
  transform: (value: string) => t.TypeOf<TValidation>;
  validation: TValidation;
  stringValidation?: Decoder<string>;
}

export function parameterString(): StringParameterTransform<t.StringType>;
export function parameterString<TDecoder extends Decoder<string> & t.Mixed>(
  customString: TDecoder,
): StringParameterTransform<TDecoder>;
export function parameterString<TDecoder extends Decoder<string> & t.Mixed>(
  customString?: TDecoder,
): StringParameterTransform<TDecoder | t.StringType> {
  return customString
    ? {
        transform: (str) => str,
        validation: customString,
      }
    : {
        // Copy to prevent modifications by caller
        ...parameterStringValue,
      };
}

const parameterStringValue: StringParameterTransform<t.StringType> = {
  transform: (str) => str,
  validation: t.string,
};

export const parameterBoolean = () =>
  // Copy to prevent modifications by caller
  ({ ...parameterBooleanValue });

const parameterBooleanValue: StringParameterTransform<t.BooleanType> = {
  validation: t.boolean,
  stringValidation: t.keyof({ true: "", false: "" }),
  transform: (str) => str === "true",
};

export const inputValidator = <T>(
  validation: Decoder<T>,
  strictContentType = false,
  opts?: rawbody.Options,
): core.DataValidatorRequestInputSpec<T, ValidationError, ValidatorSpec> => {
  const jsonValidation = core.transitiveDataValidation(
    (inputString: string) => {
      if (inputString.length > 0) {
        try {
          return {
            error: "none",
            data: JSON.parse(inputString) as unknown,
          };
        } catch (e) {
          return {
            error: "error",
            errorInfo: exceptionAsValidationError(inputString, e),
          };
        }
      } else {
        // No body supplied -> appear as undefined
        return {
          error: "none",
          data: undefined,
        };
      }
    },
    plainValidator(validation),
  );

  return {
    validator: async ({ contentType, input }) => {
      return contentType.startsWith(CONTENT_TYPE) ||
        (!strictContentType && contentType.length === 0)
        ? // stream._decoder || (state && (state.encoding || state.decoder))
          jsonValidation(
            await rawbody.default(input, {
              ...(opts ?? {}),
              // TODO get encoding from headers (or perhaps content type value? e.g. application/json;encoding=utf8)
              encoding: opts?.encoding ?? "utf8",
            }),
          )
        : {
            error: "unsupported-content-type",
            supportedContentTypes: [CONTENT_TYPE],
          };
    },
    validatorSpec: { [CONTENT_TYPE]: validation },
  };
};

export const outputValidator = <TOutput, TSerialized>(
  validation: Encoder<TOutput, TSerialized>,
): core.DataValidatorResponseOutputSpec<
  TOutput,
  ValidationError,
  OutputValidatorSpec
> => ({
  validator: (output) => {
    try {
      return {
        error: "none",
        data: {
          contentType: CONTENT_TYPE,
          output: JSON.stringify(validation.encode(output)),
        },
      };
    } catch (e) {
      return {
        error: "error",
        errorInfo: exceptionAsValidationError(output, e),
      };
    }
  },
  validatorSpec: {
    [CONTENT_TYPE]: validation,
  },
});

export const plainValidator =
  <TInput, TData>(
    validation: Decoder<TData, TInput>,
  ): core.DataValidator<TInput, TData, ValidationError> =>
  (input) =>
    transformIoTsResultToModelResult(validation.decode(input));

const transformIoTsResultToModelResult = <TData>(
  validationResult: t.Validation<TData>,
): core.DataValidatorResult<TData, ValidationError> =>
  validationResult._tag === "Right"
    ? {
        error: "none",
        data: validationResult.right,
      }
    : {
        error: "error",
        errorInfo: validationResult.left,
      };

export const getHumanReadableErrorMessage = (error: ValidationError) =>
  PathReporter.report({
    _tag: "Left",
    left: error,
  }).join("  \n");

const exceptionAsValidationError = (
  input: unknown,
  exception: unknown,
): ValidationError => [
  {
    value: input,
    message: `${exception}`,
    context: [],
  },
];

const createValidatorForStringParameter =
  <TValidation extends t.Mixed>({
    transform,
    validation,
    stringValidation,
  }: StringParameterTransform<TValidation>): core.DataValidator<
    string,
    t.TypeOf<TValidation>,
    ValidationError
  > =>
  (str) => {
    try {
      if (stringValidation) {
        const stringValidationResult = transformIoTsResultToModelResult(
          stringValidation.decode(str),
        );
        switch (stringValidationResult.error) {
          case "none":
            str = stringValidationResult.data;
            break;
          default:
            return stringValidationResult;
        }
      }
      return transformIoTsResultToModelResult(
        validation.decode(transform(str)),
      );
    } catch (e) {
      return {
        error: "error",
        errorInfo: exceptionAsValidationError(str, e),
      };
    }
  };
