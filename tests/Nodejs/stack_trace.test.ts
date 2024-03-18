
import { ConsoleSink, Logger, PrettyPrinterTransport, Sink } from "../../src"


const sink: Sink = jest.fn().mockImplementation(ConsoleSink)

const logger = new Logger(undefined, [
    new PrettyPrinterTransport(sink, {
        prettyLogTemplate: "{{filePathWithLine}}"
    })
])

describe("Stack Trace", () => {
    it("should print file path with line", () => {
        logger.info("test", 0, { test: 123 });
        
        expect(sink).toHaveBeenCalledWith(expect.stringMatching(/tests\/Nodejs\/stack_trace\.test\.ts:\d+?/g), expect.any(Number))
    })
})


