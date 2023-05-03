import { formatNumberAddZeros } from "./formatNumberAddZeros";
import { formatTemplate } from "./formatTemplate";
import { ILogObjMeta, IPrettyPrinterTransportSettings, ITransport } from "./interfaces";
import { prettyFormatLogObj } from "./runtime";
import { formatWithOptions } from "./runtime/util.inspect.polyfil";

export type Sink = (formattedString: string, logLevelId: number) => void;

export const ConsoleSink = (formattedString: string, logLevelId: number) => {
    if (logLevelId >= 4) {
        console.error(formattedString);
    } else {
        console.log(formattedString);
    }
};

export class PrettyPrinterTransport implements ITransport {
    public settings: IPrettyPrinterTransportSettings;
    public sink: Sink;

    constructor(sink: Sink, settings: Partial<IPrettyPrinterTransportSettings>) {
        this.sink = sink;

        this.settings = {
            hideLogPositionForProduction: settings?.hideLogPositionForProduction ?? false,
            prettyLogTemplate:
                settings?.prettyLogTemplate ??
                "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t{{filePathWithLine}}{{nameWithDelimiterPrefix}}\t",
            prettyErrorTemplate: settings?.prettyErrorTemplate ?? "\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}",
            prettyErrorStackTemplate: settings?.prettyErrorStackTemplate ?? "  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}",
            prettyErrorParentNamesSeparator: settings?.prettyErrorParentNamesSeparator ?? ":",
            prettyErrorLoggerNameDelimiter: settings?.prettyErrorLoggerNameDelimiter ?? "\t",
            stylePrettyLogs: settings?.stylePrettyLogs ?? true,
            prettyLogTimeZone: settings?.prettyLogTimeZone ?? "UTC",
            prettyLogStyles: settings?.prettyLogStyles ?? {
                logLevelName: {
                    "*": ["bold", "black", "bgWhiteBright", "dim"],
                    SILLY: ["bold", "white"],
                    TRACE: ["bold", "whiteBright"],
                    DEBUG: ["bold", "green"],
                    INFO: ["bold", "blue"],
                    WARN: ["bold", "yellow"],
                    ERROR: ["bold", "red"],
                    FATAL: ["bold", "redBright"],
                },
                dateIsoStr: "white",
                filePathWithLine: "white",
                name: ["white", "bold"],
                nameWithDelimiterPrefix: ["white", "bold"],
                nameWithDelimiterSuffix: ["white", "bold"],
                errorName: ["bold", "bgRedBright", "whiteBright"],
                fileName: ["yellow"],
                fileNameWithLine: "white",
            },
        };
    }

    transport(logArgs: unknown[], meta: ILogObjMeta): void {
        let logArgsAndErrorsMarkup: { args: unknown[]; errors: string[] } | undefined = undefined;

        const logMetaMarkup = this._prettyFormatLogObjMeta(meta);
        logArgsAndErrorsMarkup = prettyFormatLogObj(logArgs, this.settings);

        const logMarkup = formatWithOptions({ colors: true }, ...logArgs);
        const logErrorsStr = (logArgsAndErrorsMarkup.errors.length > 0 && logArgs.length > 0 ? "\n" : "") + logArgsAndErrorsMarkup.errors.join("\n");

        this.sink(logMetaMarkup + logMarkup + logErrorsStr, meta.logLevelId);
    }

    private _prettyFormatLogObjMeta(logObjMeta?: ILogObjMeta): string {
        if (logObjMeta == null) {
            return "";
        }

        let template = this.settings.prettyLogTemplate;

        const placeholderValues = {};

        // date and time performance fix
        if (template.includes("{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}")) {
            template = template.replace("{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}", "{{dateIsoStr}}");
        } else {
            if (this.settings.prettyLogTimeZone === "UTC") {
                placeholderValues["yyyy"] = logObjMeta?.date?.getUTCFullYear() ?? "----";
                placeholderValues["mm"] = formatNumberAddZeros(logObjMeta?.date?.getUTCMonth(), 2, 1);
                placeholderValues["dd"] = formatNumberAddZeros(logObjMeta?.date?.getUTCDate(), 2);
                placeholderValues["hh"] = formatNumberAddZeros(logObjMeta?.date?.getUTCHours(), 2);
                placeholderValues["MM"] = formatNumberAddZeros(logObjMeta?.date?.getUTCMinutes(), 2);
                placeholderValues["ss"] = formatNumberAddZeros(logObjMeta?.date?.getUTCSeconds(), 2);
                placeholderValues["ms"] = formatNumberAddZeros(logObjMeta?.date?.getUTCMilliseconds(), 3);
            } else {
                placeholderValues["yyyy"] = logObjMeta?.date?.getFullYear() ?? "----";
                placeholderValues["mm"] = formatNumberAddZeros(logObjMeta?.date?.getMonth(), 2, 1);
                placeholderValues["dd"] = formatNumberAddZeros(logObjMeta?.date?.getDate(), 2);
                placeholderValues["hh"] = formatNumberAddZeros(logObjMeta?.date?.getHours(), 2);
                placeholderValues["MM"] = formatNumberAddZeros(logObjMeta?.date?.getMinutes(), 2);
                placeholderValues["ss"] = formatNumberAddZeros(logObjMeta?.date?.getSeconds(), 2);
                placeholderValues["ms"] = formatNumberAddZeros(logObjMeta?.date?.getMilliseconds(), 3);
            }
        }
        const dateInSettingsTimeZone =
            this.settings.prettyLogTimeZone === "UTC"
                ? logObjMeta?.date
                : new Date(logObjMeta?.date?.getTime() - logObjMeta?.date?.getTimezoneOffset() * 60000);
        placeholderValues["rawIsoStr"] = dateInSettingsTimeZone?.toISOString();
        placeholderValues["dateIsoStr"] = dateInSettingsTimeZone?.toISOString().replace("T", " ").replace("Z", "");
        placeholderValues["logLevelName"] = logObjMeta?.logLevelName;
        placeholderValues["fileNameWithLine"] = logObjMeta?.path?.fileNameWithLine ?? "";
        placeholderValues["filePathWithLine"] = logObjMeta?.path?.filePathWithLine ?? "";
        placeholderValues["fullFilePath"] = logObjMeta?.path?.fullFilePath ?? "";
        // name
        // name
        let parentNamesString = logObjMeta.parentNames?.join(this.settings.prettyErrorParentNamesSeparator);
        parentNamesString =
            parentNamesString != null && logObjMeta?.name != null ? parentNamesString + this.settings.prettyErrorParentNamesSeparator : undefined;
        placeholderValues["name"] = logObjMeta?.name != null || parentNamesString != null ? (parentNamesString ?? "") + logObjMeta?.name ?? "" : "";
        placeholderValues["nameWithDelimiterPrefix"] =
            placeholderValues["name"].length > 0 ? this.settings.prettyErrorLoggerNameDelimiter + placeholderValues["name"] : "";
        placeholderValues["nameWithDelimiterSuffix"] =
            placeholderValues["name"].length > 0 ? placeholderValues["name"] + this.settings.prettyErrorLoggerNameDelimiter : "";

        return formatTemplate(this.settings, template, placeholderValues);
    }
}
