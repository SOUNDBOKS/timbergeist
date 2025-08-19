import "ts-jest";
import { ILogObjMeta, Logger } from "../../src/index.js";
import { getConsoleOutput, mockConsoleLog } from "./helper.js";

describe("Pretty: Settings", () => {
    beforeEach(() => {
        mockConsoleLog(true, false);
    });

    test("plain string", (): void => {
        const logger = new Logger();
        logger.log(1234, "testLevel", "Test");
        expect(getConsoleOutput()).toContain("testLevel");
        expect(getConsoleOutput()).toContain("Test");
    });

    test("two strings", (): void => {
        const logger = new Logger();
        logger.log(1234, "testLevel", "Test1", "Test2");
        expect(getConsoleOutput()).toContain("Test1 Test2");
    });

    test("name", (): void => {
        const logsMeta: ILogObjMeta[] = [];
        const logger = new Logger({ name: "logger" });
        logger.attachTransport({ transport: (logArgs, logMeta) => {
            logsMeta.push(logMeta);
        }});
        logger.log(1, "testLevel", "foo bar");
        expect(logsMeta[0]).toBeDefined();
        expect(logsMeta[0].name).toBe("logger");
        expect(getConsoleOutput()).toContain(`logger`);
    });

    test("name with sub-logger inheritance", (): void => {
        const logsMeta: ILogObjMeta[] = [];
        const logger1 = new Logger({ name: "logger1" });
        const logger2 = logger1.getSubLogger({ name: "logger2" });
        const logger3 = logger2.getSubLogger({ name: "logger3" });

        logger1.attachTransport({ transport: (logArgs, logMeta) => {
            logsMeta.push(logMeta);
        }});

        logger1.log(1, "testLevel", "foo bar");
        logger2.log(1, "testLevel", "foo bar");
        logger3.log(1, "testLevel", "foo bar");

        expect(logsMeta.length).toBe(3);

        expect(logsMeta[0].name).toBe("logger1");
        expect(logsMeta[1].name).toBe("logger2");
        expect(logsMeta[2].name).toBe("logger3");

        expect(getConsoleOutput()).toContain(`logger1`);
        expect(getConsoleOutput()).toContain(`logger1:logger2`);
        expect(getConsoleOutput()).toContain(`logger1:logger2:logger3`);
    });

    test("argumentsArray", (): void => {
        const logger = new Logger({
            argumentsArrayName: "argumentsArray",
        });
        logger.log(1234, "testLevel", "Test1", "Test2");
        expect(getConsoleOutput()).toContain("Test1 Test2");
    });

    test("metaProperty", (): void => {
        const logger = new Logger({ defaultMetadata: { _test: "test" } });
        logger.log(1234, "testLevel", "Test");
        expect(getConsoleOutput()).toContain("Test");
    });

    test("Change settings: minLevel", (): void => {
        const logger = new Logger({
            minLevel: 1,
        });
        logger.log(1, "custom_level_one", "LOG1");
        logger.log(2, "custom_level_two", "LOG2");

        // change minLevel to 2
        logger.options.minLevel = 2;
        logger.log(1, "custom_level_one", "LOG3");
        logger.log(2, "custom_level_two", "LOG4");

        expect(getConsoleOutput()).toContain(`LOG1`);
        expect(getConsoleOutput()).toContain(`LOG2`);
        expect(getConsoleOutput()).not.toContain(`LOG3`);
        expect(getConsoleOutput()).toContain(`LOG4`);
    });
});
