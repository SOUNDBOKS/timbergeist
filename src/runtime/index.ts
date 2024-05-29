import { ILogObjMeta, IPrettyPrinterTransportSettings, IStackFrame } from "../interfaces";
import { formatTemplate } from "../formatTemplate";

const pathRegex = /(?:(?:file|https?|global code|[^@]+)@)?(?:file:)?((?:\/[^:/]+){2,})(?::(\d+))?(?::(\d+))?/;

export function getMeta(logLevelId: number, logLevelName: string, stackDepthLevel: number, name?: string, parentNames?: string[]): ILogObjMeta {
    return {
        __tgLogFormatVersion: 1,
        name,
        parentNames,
        date: new Date(),
        logLevelId,
        logLevelName,
        path: getCallerStackFrame(stackDepthLevel),
    };
}

export function getCallerStackFrame(stackDepthLevel: number, error: Error = Error()): IStackFrame {
    return stackLineToStackFrame((error as Error | undefined)?.stack?.split("\n")?.filter((line: string) => !line.startsWith("Error"))?.[stackDepthLevel]);
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


/**
 * Very mediocre re-implementation of path.relative
 * Does not currently handle the root being under the path.
 * 
 * i.e. root = /a/b/c and path = /a/foo
 * in these cases we don't try to relativise
 * 
 * @param root
 * @param path 
 * @returns 
 */
function pathRelative(root: string, path: string) {
    if (path.startsWith(root)) {
        return "." + path.slice(root.length);
    }

    return path;
}

function tryRelativise(path: string) {
    const isNode = ![typeof process, typeof require].includes("undefined");
    
    if (!isNode || !process.cwd) {
        return path;
    }

    return pathRelative(process.cwd(), path);
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
            pathResult.fullFilePath = match[1].replace(/\?.*$/, "");
            const pathParts = pathResult.fullFilePath.split("/");
            pathResult.filePath = tryRelativise(pathResult.fullFilePath);
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

export function isBuffer(arg?: unknown) {
    return arg ? undefined : undefined;
}
