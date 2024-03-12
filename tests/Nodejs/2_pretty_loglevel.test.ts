import "ts-jest";
import { Logger } from "../../src/index.js";
import { getConsoleOutput, mockConsoleLog } from "./helper.js";

const logger = new Logger();

describe("Pretty: Log level", () => {
    beforeEach(() => {
        mockConsoleLog(true, true);
    });

    test("silly (console)", (): void => {
        logger.silly("Test");
        expect(getConsoleOutput()).toContain("SILLY");
        expect(getConsoleOutput()).toContain("Test");
        expect(getConsoleOutput()).toContain(`${new Date().toISOString().replace("T", " ")[0]}`); // ignore time
        expect(getConsoleOutput()).toContain("/2_pretty_loglevel.test.ts:13");
    });

    test("trace (console)", (): void => {
        logger.trace("Test");
        expect(getConsoleOutput()).toContain("TRACE");
        expect(getConsoleOutput()).toContain("Test");
    });

    test("debug (console)", (): void => {
        logger.debug("Test");
        expect(getConsoleOutput()).toContain("DEBUG");
        expect(getConsoleOutput()).toContain("Test");
    });

    test("info (console)", (): void => {
        logger.info("Test");
        expect(getConsoleOutput()).toContain("INFO");
        expect(getConsoleOutput()).toContain("Test");
    });

    test("warn (console)", (): void => {
        logger.warn("Test");
        expect(getConsoleOutput()).toContain("WARN");
        expect(getConsoleOutput()).toContain("Test");
    });

    test("error (console)", (): void => {
        logger.error("Test");
        expect(getConsoleOutput()).toContain("ERROR");
        expect(getConsoleOutput()).toContain("Test");
    });

    test("fatal (console)", (): void => {
        logger.fatal("Test");
        expect(getConsoleOutput()).toContain("FATAL");
        expect(getConsoleOutput()).toContain("Test");
    });
});
