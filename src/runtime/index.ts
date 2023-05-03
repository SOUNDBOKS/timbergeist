import { ILogObjMeta, IPrettyPrinterTransportSettings, IStackFrame } from "../interfaces.js";
import { formatTemplate } from "../formatTemplate.js";
import { formatWithOptions } from "./util.inspect.polyfil.js";
import { jsonStringifyRecursive } from "./helper.jsonStringifyRecursive.js";

const pathRegex = /(?:(?:file|https?|global code|[^@]+)@)?(?:file:)?((?:\/[^:/]+){2,})(?::(\d+))?(?::(\d+))?/;

export function getMeta(logLevelId: number, logLevelName: string, stackDepthLevel: number, name?: string, parentNames?: string[]): ILogObjMeta {
    // faster than spread operator
    return {
        name,
        parentNames,
        date: new Date(),
        logLevelId,
        logLevelName,
        path: getCallerStackFrame(stackDepthLevel),
    };
}

export function getCallerStackFrame(stackDepthLevel: number, error: Error = Error()): IStackFrame {
    return stackLineToStackFrame((error as Error | undefined)?.stack?.split("\n")?.filter((line: string) => !line.includes("Error: "))?.[stackDepthLevel]);
}

export function getErrorTrace(error: Error): IStackFrame[] {
    return (error as Error)?.stack
        ?.split("\n")
        ?.filter((line: string) => !line.includes("Error: "))
        ?.reduce((result: IStackFrame[], line: string) => {
            result.push(stackLineToStackFrame(line));

            return result;
        }, []) as IStackFrame[];
}

function stackLineToStackFrame(line?: string): IStackFrame {
    const pathResult: IStackFrame = {
        fullFilePath: undefined,
        fileName: undefined,
        fileNameWithLine: undefined,
        fileColumn: undefined,
        fileLine: undefined,
        filePath: undefined,
        filePathWithLine: undefined,
        method: undefined,
    };
    if (line != null) {
        const match = line.match(pathRegex);
        if (match) {
            pathResult.filePath = match[1].replace(/\?.*$/, "");
            const pathParts = pathResult.filePath.split("/");
            pathResult.fileName = pathParts[pathParts.length - 1];
            pathResult.fileLine = match[2];
            pathResult.fileColumn = match[3];
            pathResult.filePathWithLine = `${pathResult.filePath}:${pathResult.fileLine}`;
            pathResult.fileNameWithLine = `${pathResult.fileName}:${pathResult.fileLine}`;
        }
    }

    return pathResult;
}

export function isError(e: Error | unknown): boolean {
    return e instanceof Error;
}

export function prettyFormatLogObj(maskedArgs: unknown[], settings: IPrettyPrinterTransportSettings): { args: unknown[]; errors: string[] } {
    return maskedArgs.reduce(
        (result: { args: unknown[]; errors: string[] }, arg) => {
            isError(arg) ? result.errors.push(prettyFormatErrorObj(arg as Error, settings)) : result.args.push(arg);
            return result;
        },
        { args: [], errors: [] }
    );
}

export function prettyFormatErrorObj(error: Error, settings: IPrettyPrinterTransportSettings): string {
    const errorStackStr = getErrorTrace(error as Error).map((stackFrame) => {
        return formatTemplate(settings, settings.prettyErrorStackTemplate, { ...stackFrame }, true);
    });

    const placeholderValuesError = {
        errorName: ` ${error.name} `,
        errorMessage: error.message,
        errorStack: errorStackStr.join("\n"),
    };
    return formatTemplate(settings, settings.prettyErrorTemplate, placeholderValuesError);
}

export function transportFormatted(logMetaMarkup: string, logArgs: unknown[], logErrors: string[]): void {
    const logErrorsStr = (logErrors.length > 0 && logArgs.length > 0 ? "\n" : "") + logErrors.join("\n");
    console.log(logMetaMarkup + formatWithOptions({ colors: true }, ...logArgs) + logErrorsStr);
}

export function transportJSON<LogObj>(json: LogObj & ILogObjMeta): void {
    console.log(jsonStringifyRecursive(json));
}

export function isBuffer(arg?: unknown) {
    return arg ? undefined : undefined;
}
