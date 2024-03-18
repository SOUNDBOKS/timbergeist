import { ConsoleSink, Logger, PrettyPrinterTransport, Sink } from "../../src"


const sink: Sink = (formattedString: string, logLevelId: number) => {
    ConsoleSink(formattedString, logLevelId);

    if (/tests\/Raw\/stack_trace\.test\.(js|ts):\d+?/g.test(formattedString)) {
        return;
    }

    throw new Error("Formatted string does not match the expected pattern.");
}

const logger = new Logger(undefined, [
    new PrettyPrinterTransport(sink, {})
])

logger.info("stack_trace.test passed");
