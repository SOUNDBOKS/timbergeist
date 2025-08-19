import "ts-jest";
import { Logger } from "../../src/index.js";

describe("SubLoggers", () => {
    test("one sub logger", (): void => {
        const transports: any[] = [];
        const mainLogger = new Logger();
        mainLogger.attachTransport({ transport: (logObj) => {
            transports.push(logObj);
        }});
        mainLogger.info("main logger");
        expect(transports[0]).toMatchObject({
            "0": "main logger",
        });

        const subLogger = mainLogger.getSubLogger();
        subLogger.info("sub logger");
        expect(transports[1]).toMatchObject({
            "0": "sub logger",
        });
    });

    test("one sub logger with prefix", (): void => {
        const loggerNames: any[] = [];
        const mainLogger = new Logger({ name: "main" });
        mainLogger.attachTransport({ transport: (logArgs, logMeta) => {
            loggerNames.push(logMeta);
        }});
        mainLogger.info("test-main");
        expect(loggerNames[0].name).toBe("main");

        const subLogger = mainLogger.getSubLogger({ name: "sub" });
        subLogger.info("test-sub");
        expect(loggerNames[1].name).toBe("sub");
        expect(loggerNames[1].parentNames).toContain("main");
    });
});
