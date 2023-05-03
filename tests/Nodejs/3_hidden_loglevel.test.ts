import "ts-jest";
import { Logger } from "../../src/index.js";
import { getConsoleLog, mockConsoleLog } from "./helper.js";

const logger = new Logger();
describe("Hidden: Log level", () => {
    beforeEach(() => {
        mockConsoleLog(true, false);
    });

    test("silly (console)", (): void => {
        logger.silly("Test");
        expect(getConsoleLog()).toContain("");
    });
});
