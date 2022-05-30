import * as model from "../model";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import * as rawbody from "raw-body";
import * as q from "querystring";

export type ValidationError = t.Errors;
export type Decoder<TData, TInput = unknown> = t.Decoder<TInput, TData> & {
  _tag: string;
};

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
>): model.QueryValidatorSpec<
  { [P in TRequired]: t.TypeOf<TValidation[P]["validation"]> } & {
    [P in TOptional]?: t.TypeOf<TValidation[P]["validation"]>;
  },
  ValidationError,
  TRequired | TOptional
> => {
  const initialValidator = plainValidator(
    t.exact(
      t.intersection([
        t.type(Object.fromEntries(required.map((r) => [r, t.string]))),
        t.partial(Object.fromEntries(optional.map((o) => [o, t.string]))),
      ]),
    ),
  );
  const finalValidator = model.transitiveDataValidation(
    initialValidator,
    (data) => {
      const finalResult: Record<string, unknown> = {};
      const errors: ValidationError = [];
      for (const [key, dataItemIter] of Object.entries(data)) {
        let dataItem = dataItemIter;
        try {
          const {
            transform,
            validation: parameterValidation,
            stringValidation,
          } = validation[key as keyof typeof validation];
          const curErrorsCount = errors.length;
          if (stringValidation) {
            const stringValidationResult = transformIoTsResultToModelResult(
              stringValidation.decode(dataItem),
            );
            switch (stringValidationResult.error) {
              case "none":
                dataItem = stringValidationResult.data;
                break;
              default:
                errors.push(...stringValidationResult.errorInfo);
                break;
            }
          }
          if (errors.length == curErrorsCount) {
            const validationResult = transformIoTsResultToModelResult(
              parameterValidation.decode(transform(dataItem)),
            );
            switch (validationResult.error) {
              case "none":
                finalResult[key] = validationResult.data;
                break;
              default:
                errors.push(...validationResult.errorInfo);
                break;
            }
          }
        } catch (e) {
          errors.push(...exceptionAsValidationError(dataItem, e));
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
      validator: finalValidator as model.DataValidator<
        q.ParsedUrlQuery,
        { [P in TRequired]: t.TypeOf<TValidation[P]["validation"]> } & {
          [P in TOptional]?: t.TypeOf<TValidation[P]["validation"]>;
        },
        ValidationError
      >,
    },
    queryParameterNames: [...required, ...optional],
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

export function queryParameterString(): StringParameterTransform<t.StringType>;
export function queryParameterString<
  TDecoder extends Decoder<string> & t.Mixed,
>(customString: TDecoder): StringParameterTransform<TDecoder>;
export function queryParameterString<
  TDecoder extends Decoder<string> & t.Mixed,
>(customString?: TDecoder): StringParameterTransform<TDecoder | t.StringType> {
  return customString
    ? {
        transform: (str) => str,
        validation: customString,
      }
    : {
        // Copy to prevent modifications by caller
        ...queryParameterStringValue,
      };
}

const queryParameterStringValue: StringParameterTransform<t.StringType> = {
  transform: (str) => str,
  validation: t.string,
};

export const queryParameterBoolean = () =>
  // Copy to prevent modifications by caller
  ({ ...queryParameterBooleanValue });

const queryParameterBooleanValue: StringParameterTransform<t.BooleanType> = {
  validation: t.boolean,
  stringValidation: t.keyof({ true: "", false: "" }),
  transform: (str) => str === "true",
};

// We only support json things for io-ts validation.
const CONTENT_TYPE = "application/json" as const;

export const inputValidator = <T>(
  validation: Decoder<T>,
  strictContentType = false,
): model.DataValidatorRequestInputSpec<T, ValidationError> => {
  const jsonValidation = model.transitiveDataValidation(
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
        ? jsonValidation(await rawbody.default(input, { encoding: "utf8" }))
        : {
            error: "unsupported-content-type",
            supportedContentTypes: [CONTENT_TYPE],
          };
    },
  };
};

export const outputValidator = <TOutput, TSerialized>(
  validation: t.Encoder<TOutput, TSerialized> & { _tag: string },
): model.DataValidatorResponseOutputSpec<TOutput, ValidationError> => ({
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
});

export const plainValidator =
  <TInput, TData>(
    validation: Decoder<TData, TInput>,
  ): model.DataValidator<TInput, TData, ValidationError> =>
  (input) =>
    transformIoTsResultToModelResult(validation.decode(input));

const transformIoTsResultToModelResult = <TData>(
  validationResult: t.Validation<TData>,
): model.DataValidatorResult<TData, ValidationError> =>
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
  }).join("\n");

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
