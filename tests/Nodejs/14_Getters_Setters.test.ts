import "ts-jest";
import { Logger } from "../../src/index.js";
import { getConsoleOutput, mockConsoleLog } from "./helper.js";

class MissingSetter {
    get testProp(): string {
        return "test";
    }
}

const missingSetter = {
    get testProp(): string {
        return "test";
    },
};

describe("Getters and setters", () => {
    beforeEach(() => {
        mockConsoleLog(true, false);
    });

    test("[class] should not print getters on class instance (prototype)", (): void => {
        // Node.js issue: https://github.com/nodejs/node/issues/30183
        const logger = new Logger();
        const missingSetterObj = new MissingSetter();
        logger.info(missingSetterObj);
        expect(getConsoleOutput()).not.toContain("testProp");
    });

    test("[object] should print getters", (): void => {
        const logger = new Logger();
        logger.info(missingSetter);
        expect(getConsoleOutput()).toContain("testProp");
    });
});
