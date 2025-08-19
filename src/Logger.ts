import { getMeta } from "./runtime/index";
import { ILogOptionsParam, ILogOptions, ILogObjMeta, ITransport } from "./interfaces";
import { ConsoleSink, PrettyPrinterTransport } from "./prettyPrinter";
export * from "./interfaces";

export enum LogLevel {
    SILLY = 0,
    TRACE = 1,
    DEBUG = 2,
    INFO = 3,
    WARN = 4,
    ERROR = 5,
    FATAL = 6,
}

export class Logger<Meta extends ILogObjMeta = ILogObjMeta> {
    private parentLogger: Logger<Meta> | null = null;
    private attachedTransports: ITransport[];

    public options: ILogOptions<Meta>;

    constructor(options?: ILogOptionsParam<Meta>, transports?: ITransport[], private stackDepthLevel: number = 4) {
        const isBrowser = ![typeof window, typeof document].includes("undefined");
        const isSafari = isBrowser ? /^((?!chrome|android).)*safari/i.test(navigator?.userAgent) : false;
        const isBun = "Bun" in global;

        this.stackDepthLevel = isSafari ? 4 : isBun ? 3 : this.stackDepthLevel;

        this.attachedTransports = transports || [new PrettyPrinterTransport(ConsoleSink, {})];
        this.options = {
            name: options?.name,
            minLevel: options?.minLevel ?? 0,
            argumentsArrayName: options?.argumentsArrayName,
            overwrite: {
                mask: options?.overwrite?.mask,
                mapMeta: options?.overwrite?.mapMeta,
            },
            parentNames: options?.parentNames || [],
            defaultMetadata: options?.defaultMetadata,
        };

        // style only for server and blink browsers
        // this.settings.stylePrettyLogs = this.settings.stylePrettyLogs && isBrowser && !isBrowserBlinkEngine ? false : this.settings.stylePrettyLogs;
    }

    public transport(args: unknown[], meta: ILogObjMeta) {
        const maskedArgs: unknown[] =
            this.options.overwrite?.mask != null
                ? this.options.overwrite?.mask(args)
                : args;

        meta = this.options.defaultMetadata ? { ...this.options.defaultMetadata, ...meta } : meta;
        meta = this.options.overwrite?.mapMeta?.call(undefined, args, meta) ?? meta;

        if (meta.logLevelId >= this.options.minLevel) {
            this.attachedTransports.forEach((transport) => {
                transport.transport(maskedArgs, meta);
            });

            if (this.parentLogger) {
                this.parentLogger.transport(maskedArgs, meta);
            }
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
    public getSubLogger(settings?: ILogOptionsParam<Meta>): Logger<Meta> {
        const subLoggerSettings: ILogOptions<Meta> = {
            ...{
                ...this.options,
                name: undefined,
                overwrite: undefined,
            },
            ...settings,
            parentNames: [...(this.options.parentNames || []), ...(this.options?.name ? [this.options.name] : [])],
        };

        const subLogger = new Logger(subLoggerSettings, [], this.stackDepthLevel);
        subLogger.parentLogger = this;

        return subLogger;
    }

    /**
     * Logs a silly message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public silly(...args: unknown[]) {
        return this.log(LogLevel.SILLY, "SILLY", ...args);
    }

    /**
     * Logs a trace message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public trace(...args: unknown[]) {
        return this.log(LogLevel.TRACE, "TRACE", ...args);
    }

    /**
     * Logs a debug message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public debug(...args: unknown[]) {
        return this.log(LogLevel.DEBUG, "DEBUG", ...args);
    }

    /**
     * Logs an info message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public info(...args: unknown[]) {
        return this.log(LogLevel.INFO, "INFO", ...args);
    }

    /**
     * Logs a warn message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public warn(...args: unknown[]) {
        return this.log(LogLevel.WARN, "WARN", ...args);
    }

    /**
     * Logs an error message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public error(...args: unknown[]) {
        return this.log(LogLevel.ERROR, "ERROR", ...args);
    }

    /**
     * Logs a fatal message.
     * @param args  - Multiple log attributes that should be logged out.
     */
    public fatal(...args: unknown[]) {
        return this.log(LogLevel.FATAL, "FATAL", ...args);
    }
}
