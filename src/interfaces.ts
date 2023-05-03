export type IMeta = {
    date: Date;
    logLevelId: number;
    logLevelName: string;
    path?: IStackFrame;
    name?: string;
    parentNames?: string[];
};

export type TStyle =
    | null
    | string
    | string[]
    | {
          [value: string]: null | string | string[];
      };

export interface ITransport {
    transport(logArgs: unknown[], meta: ILogObjMeta): void;
}

export interface ILogOptionsParam {
    name?: string;
    minLevel?: number;
    argumentsArrayName?: string;
    maskPlaceholder?: string;
    maskValuesOfKeys?: string[];
    maskValuesOfKeysCaseInsensitive?: boolean;
    /** Mask all occurrences (case-sensitive) from values in logs (e.g. all secrets from ENVs etc.). Will be replaced with [***] */
    maskValuesRegEx?: RegExp[];
    propagateLogsToParent?: boolean;
    parentNames?: string[];
    overwrite?: {
        mask?: (args: unknown[]) => unknown[];
        addMeta?: (logArgs: unknown[], baseMeta: ILogObjMeta) => ILogObjMeta;
    };
}

export interface IPrettyPrinterTransportSettings {
    hideLogPositionForProduction?: boolean;
    prettyLogTemplate: string;
    prettyErrorTemplate: string;
    prettyErrorStackTemplate: string;
    prettyErrorParentNamesSeparator: string;
    prettyErrorLoggerNameDelimiter: string;
    stylePrettyLogs: boolean;
    prettyLogTimeZone: "UTC" | "local";
    prettyLogStyles: {
        yyyy?: TStyle;
        mm?: TStyle;
        dd?: TStyle;
        hh?: TStyle;
        MM?: TStyle;
        ss?: TStyle;
        ms?: TStyle;
        dateIsoStr?: TStyle;
        logLevelName?: TStyle;
        fileName?: TStyle;
        fileNameWithLine?: TStyle;
        filePath?: TStyle;
        fileLine?: TStyle;
        filePathWithLine?: TStyle;
        name?: TStyle;
        nameWithDelimiterPrefix?: TStyle;
        nameWithDelimiterSuffix?: TStyle;
        errorName?: TStyle;
        errorMessage?: TStyle;
    };
}

export interface ILogOptions extends ILogOptionsParam {
    name?: string;
    minLevel: number;
    maskPlaceholder: string;
    maskValuesOfKeys: string[];
    maskValuesOfKeysCaseInsensitive: boolean;
    propagateLogsToParent: boolean;
}

export type ILogObjMeta = {
    [M in keyof IMeta]: IMeta[M];
} & {
    [k: string]: unknown;
};

export interface IStackFrame {
    fullFilePath?: string;
    fileName?: string;
    fileNameWithLine?: string;
    filePath?: string;
    fileLine?: string;
    fileColumn?: string;
    filePathWithLine?: string;
    method?: string;
}

/**
 * Object representing an error with a stack trace
 * @public
 */
export interface IErrorObject {
    /** Name of the error*/
    name: string;
    /** Error message */
    message: string;
    /** native Error object */
    nativeError: Error;
    /** Stack trace of the error */
    stack: IStackFrame[];
}

/**
 * ErrorObject that can safely be "JSON.stringifed". All circular structures have been "util.inspected" into strings
 * @public
 */
export interface IErrorObjectStringifiable extends IErrorObject {
    nativeError: never;
    errorString: string;
}

/**
 * Object representing an error with a stack trace
 * @public
 */
export interface IErrorObject {
    /** Name of the error*/
    name: string;
    /** Error message */
    message: string;
    /** native Error object */
    nativeError: Error;
    /** Stack trace of the error */
    stack: IStackFrame[];
}
