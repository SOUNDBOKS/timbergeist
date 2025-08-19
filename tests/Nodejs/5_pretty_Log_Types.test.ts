import "ts-jest";
import { Logger } from "../../src/index.js";
import { ConsoleSink, PrettyPrinterTransport } from "../../src/prettyPrinter.js";
import { getConsoleOutput, mockConsoleLog } from "./helper.js";

describe("Pretty: Log Types", () => {
    beforeEach(() => {
        mockConsoleLog(true, false);
    });

    test("plain string", (): void => {
        const logger = new Logger();
        logger.log(1234, "testLevel", "Test");
        expect(getConsoleOutput()).toContain("Test");
    });

    test("string interpolation", (): void => {
        const logger = new Logger();
        logger.log(1234, "testLevel", "Foo %s", "bar");
        expect(getConsoleOutput()).toContain("Foo bar");
    });

    test("two plain string", (): void => {
        const logger = new Logger();
        logger.log(1234, "testLevel", "Test1", "Test2");
        expect(getConsoleOutput()).toContain("Test1 Test2");
    });

    test("boolean", (): void => {
        const logger = new Logger();
        logger.log(1234, "testLevel", true);
        expect(getConsoleOutput()).toContain("true");
    });

    test("number", (): void => {
        const logger = new Logger();
        logger.log(1234, "testLevel", 555);
        expect(getConsoleOutput()).toContain("555");
    });

    test("Array, stylePrettyLogs: false", (): void => {
        const logger = new Logger({}, [new PrettyPrinterTransport(ConsoleSink, { stylePrettyLogs: false })]);
        logger.log(1234, "testLevel", [1, 2, 3, "test"]);

        expect(getConsoleOutput()).toContain("[ 1, 2, 3, 'test' ]");
    });

    test("Buffer", (): void => {
        const logger = new Logger();
        const buffer = Buffer.from("foo");
        logger.log(1234, "testLevel", buffer);
        expect(getConsoleOutput()).toContain(`<Buffer 66 6f 6f>`);
        logger.log(1234, "testLevel", "1", buffer);
        expect(getConsoleOutput()).toContain(`1 <Buffer 66 6f 6f>`);
    });

    test("Object", (): void => {
        const logger = new Logger({}, [new PrettyPrinterTransport(ConsoleSink, { stylePrettyLogs: false })]);
        logger.log(1234, "testLevel", { test: true, nested: { 1: false } });
        expect(getConsoleOutput()).toContain("{ test: true, nested: { '1': false } }");
    });

    test("Date", (): void => {
        const logger = new Logger();
        const date = new Date(0);
        logger.log(1234, "testLevel", date);
        expect(getConsoleOutput()).toContain("1970-01-01T00:00:00.000Z");
    });

    test("String, Object", (): void => {
        const logger = new Logger({}, [new PrettyPrinterTransport(ConsoleSink, { stylePrettyLogs: false })]);
        logger.log(1234, "testLevel", "test", { test: true, nested: { 1: false } });
        expect(getConsoleOutput()).toContain("test { test: true, nested: { '1': false } }");
    });

    test("Object, String", (): void => {
        const logger = new Logger({}, [new PrettyPrinterTransport(ConsoleSink, { stylePrettyLogs: false })]);
        logger.log(1234, "testLevel", { test: true, nested: { 1: false } }, "test");
        expect(getConsoleOutput()).toContain("{ test: true, nested: { '1': false } } test");
    });

    test("Error", (): void => {
        const logger = new Logger();
        const errorLog = logger.log(1234, "testLevel", new Error("test"));
        expect(getConsoleOutput()).toContain("Error");
        expect(getConsoleOutput()).toContain("test");
        expect(getConsoleOutput()).toContain("error stack:\n");
        expect(getConsoleOutput()).toContain("5_pretty_Log_Types.test.ts");
        expect(getConsoleOutput()).toContain("Object.<anonymous>");
    });

    test("string and Error", (): void => {
        const logger = new Logger();
        const errorLog = logger.log(1234, "testLevel", "test", new Error("test"));
        expect(getConsoleOutput()).toContain("Error");
        expect(getConsoleOutput()).toContain("test");
        expect(getConsoleOutput()).toContain("error stack:\n");
        expect(getConsoleOutput()).toContain("5_pretty_Log_Types.test.ts");
        expect(getConsoleOutput()).toContain("Object.<anonymous>");
    });
});
