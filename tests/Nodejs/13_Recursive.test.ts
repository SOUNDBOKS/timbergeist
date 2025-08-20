import "ts-jest";
import { Logger } from "../../src/index.js";
import { getConsoleOutput, mockConsoleLog } from "./helper.js";

describe("Recursive", () => {
    beforeEach(() => {
        mockConsoleLog(true, false);
    });

    test("pretty", (): void => {
        const mainLogger = new Logger();

        /*
         * Circular example
         * */
        function Foo() {
            /* @ts-ignore */
            this.abc = "Hello";
            /* @ts-ignore */
            this.circular = this;
        }
        /* @ts-ignore */
        const foo = new Foo();
        mainLogger.info("circular", foo);
        expect(getConsoleOutput()).toContain("circular");
        expect(getConsoleOutput()).toContain("Hello");
    });
});
