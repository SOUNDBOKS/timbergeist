import { getMeta, getErrorTrace, isError, isBuffer } from "./runtime/index.js";
import { ILogOptionsParam, ILogOptions, ILogObjMeta, IErrorObject, ITransport } from "./interfaces.js";
import { ConsoleSink, PrettyPrinterTransport } from "./prettyPrinter.js";
export * from "./interfaces.js";

export class Logger {
    private parentLogger: Logger | null = null;
    private attachedTransports: ITransport[];

    public options: ILogOptions;

    constructor(options?: ILogOptionsParam, transports?: ITransport[], private stackDepthLevel: number = 4) {
        const isBrowser = ![typeof window, typeof document].includes("undefined");
        const isSafari = isBrowser ? /^((?!chrome|android).)*safari/i.test(navigator?.userAgent) : false;
        this.stackDepthLevel = isSafari ? 4 : this.stackDepthLevel;

        this.attachedTransports = transports || [new PrettyPrinterTransport(ConsoleSink, {})];
        this.options = {
            name: options?.name,
            minLevel: options?.minLevel ?? 0,
            argumentsArrayName: options?.argumentsArrayName,
            maskPlaceholder: options?.maskPlaceholder ?? "[***]",
            maskValuesOfKeys: options?.maskValuesOfKeys ?? ["password"],
            maskValuesOfKeysCaseInsensitive: options?.maskValuesOfKeysCaseInsensitive ?? false,
            maskValuesRegEx: options?.maskValuesRegEx,
            overwrite: {
                mask: options?.overwrite?.mask,
                addMeta: options?.overwrite?.addMeta,
            },
            propagateLogsToParent: options?.propagateLogsToParent ?? true,
            parentNames: options?.parentNames || [],
        };

        // style only for server and blink browsers
        // this.settings.stylePrettyLogs = this.settings.stylePrettyLogs && isBrowser && !isBrowserBlinkEngine ? false : this.settings.stylePrettyLogs;
    }

    public transport(args: unknown[], meta: ILogObjMeta) {
        const maskedArgs: unknown[] =
            this.options.overwrite?.mask != null
                ? this.options.overwrite?.mask(args)
                : this.options.maskValuesOfKeys != null && this.options.maskValuesOfKeys.length > 0
                ? this._mask(args)
                : args;

        meta = this.options.overwrite?.addMeta?.call(undefined, args, meta) ?? meta;

        if (meta.logLevelId >= this.options.minLevel) {
            this.attachedTransports.forEach((transport) => {
                transport.transport(maskedArgs, meta);
            });
        }

        if (this.options.propagateLogsToParent && this.parentLogger) {
            this.parentLogger.transport(maskedArgs, meta);
        }
    }

    /**
     * Logs a message with a custom log level.
     * @param logLevelId    - Log level ID e.g. 0
     * @param logLevelName  - Log level name e.g. silly
     * @param args          - Multiple log attributes that should be logged out.
     * @return LogObject with meta property, when log level is >= minLevel
     */
    public log(logLevelId: number, logLevelName: string, ...args: unknown[]) {
        const meta = getMeta(logLevelId, logLevelName, this.stackDepthLevel, this.options.name, this.options.parentNames);

        // TODO: Figure out what this does
        args = args?.map((arg) => (isError(arg) ? this._toErrorObject(arg as Error) : arg));

        if (logLevelId >= this.options.minLevel) {
            this.transport(args, meta);
        }
    }

    /**
     *  Attaches external Loggers, e.g. external log services, file system, database
     *
     * @param transportLogger - External logger to be attached. Must implement all log methods.
     */
    public attachTransport(transportLogger: ITransport): void {
        this.attachedTransports.push(transportLogger);
    }

    /**
     *  Returns a child logger based on the current instance with inherited settings
     *
     * @param settings - Overwrite settings inherited from parent logger
     * @param logObj - Overwrite logObj for sub-logger
     */
    public getSubLogger(settings?: ILogOptionsParam): Logger {
        const subLoggerSettings: ILogOptions = {
            ...{
                ...this.options,
                name: undefined,
                overwrite: undefined,
            },
            propagateLogsToParent: true,
            ...settings,
            parentNames: [...(this.options.parentNames || []), ...(this.options?.name ? [this.options.name] : [])],
        };

        const subLogger = new Logger(subLoggerSettings, [], this.stackDepthLevel);
        subLogger.parentLogger = this;

        return subLogger;
    }

    private _mask(args: unknown[]): unknown[] {
        const maskValuesOfKeys =
            this.options.maskValuesOfKeysCaseInsensitive !== true
                ? this.options.maskValuesOfKeys
                : this.options.maskValuesOfKeys.map((key) => key.toLowerCase());
        return args?.map((arg) => {
            return this._recursiveCloneAndMaskValuesOfKeys(arg, maskValuesOfKeys);
        });
    }

    private _recursiveCloneAndMaskValuesOfKeys<T>(source: T, keys: (number | string)[], seen: unknown[] = []): T {
        if (seen.includes(source)) {
            return { ...source };
        }
        if (typeof source === "object" && source != null) {
            seen.push(source);
        }

        return isBuffer(source)
            ? source // dont copy Buffer
            : source instanceof Map
            ? new Map(source)
            : source instanceof Set
            ? new Set(source)
            : Array.isArray(source)
            ? source.map((item) => this._recursiveCloneAndMaskValuesOfKeys(item, keys, seen))
            : source instanceof Date
            ? new Date(source.getTime())
            : isError(source)
            ? Object.getOwnPropertyNames(source).reduce((o, prop) => {
                  // mask
                  o[prop] = keys.includes(this.options?.maskValuesOfKeysCaseInsensitive !== true ? prop : prop.toLowerCase())
                      ? this.options.maskPlaceholder
                      : this._recursiveCloneAndMaskValuesOfKeys((source as { [key: string]: unknown })[prop], keys, seen);
                  return o;
              }, this._cloneError(source as Error))
            : source != null && typeof source === "object"
            ? Object.getOwnPropertyNames(source).reduce((o, prop) => {
                  // mask
                  o[prop] = keys.includes(this.options?.maskValuesOfKeysCaseInsensitive !== true ? prop : prop.toLowerCase())
                      ? this.options.maskPlaceholder
                      : this._recursiveCloneAndMaskValuesOfKeys((source as { [key: string]: unknown })[prop], keys, seen);
                  return o;
              }, Object.create(Object.getPrototypeOf(source)))
            : ((source: T): T => {
                  // mask regEx
                  this.options?.maskValuesRegEx?.forEach((regEx) => {
                      source = (source as string)?.toString()?.replace(regEx, this.options.maskPlaceholder) as T;
                  });
                  return source;
              })(source);
    }

    private _recursiveCloneAndExecuteFunctions<T>(source: T, seen: unknown[] = []): T {
        if (seen.includes(source)) {
            return { ...source };
        }
        if (typeof source === "object") {
            seen.push(source);
        }

        return Array.isArray(source)
            ? source.map((item) => this._recursiveCloneAndExecuteFunctions(item, seen))
            : source instanceof Date
            ? new Date(source.getTime())
            : source && typeof source === "object"
            ? Object.getOwnPropertyNames(source).reduce((o, prop) => {
                  Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(source, prop) as PropertyDescriptor);
                  // execute functions or clone
                  o[prop] =
                      typeof source[prop] === "function"
                          ? source[prop]()
                          : this._recursiveCloneAndExecuteFunctions((source as { [key: string]: unknown })[prop], seen);
                  return o;
              }, Object.create(Object.getPrototypeOf(source)))
            : (source as T);
    }

    private _cloneError<T extends Error>(error: T): T {
        const ErrorConstructor = error.constructor as new (message?: string) => T;
        const newError = new ErrorConstructor(error.message);
        Object.assign(newError, error);
        const propertyNames = Object.getOwnPropertyNames(newError);
        for (const propName of propertyNames) {
            const propDesc = Object.getOwnPropertyDescriptor(newError, propName);
            if (propDesc) {
                propDesc.writable = true;
                Object.defineProperty(newError, propName, propDesc);
            }
        }
        return newError;
    }

    private _toErrorObject(error: Error): IErrorObject {
        return {
            nativeError: error,
            name: error.name ?? "Error",
            message: error.message,
            stack: getErrorTrace(error),
        };
    }

    /**
     * Logs a silly message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public silly(...args: unknown[]) {
        return this.log(0, "SILLY", ...args);
    }

    /**
     * Logs a trace message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public trace(...args: unknown[]) {
        return this.log(1, "TRACE", ...args);
    }

    /**
     * Logs a debug message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public debug(...args: unknown[]) {
        return this.log(2, "DEBUG", ...args);
    }

    /**
     * Logs an info message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public info(...args: unknown[]) {
        return this.log(3, "INFO", ...args);
    }

    /**
     * Logs a warn message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public warn(...args: unknown[]) {
        return this.log(4, "WARN", ...args);
    }

    /**
     * Logs an error message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public error(...args: unknown[]) {
        return this.log(5, "ERROR", ...args);
    }

    /**
     * Logs a fatal message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public fatal(...args: unknown[]) {
        return this.log(6, "FATAL", ...args);
    }
}
