/**
 * @jest-environment puppeteer
 */
import "expect-puppeteer";

let consoleOutput = "";
describe("Browser: JSON: Log level", () => {
    beforeAll(async () => {
        jest.setTimeout(35000);
        await page.goto("http://localhost:4444", { waitUntil: "load" });
        page.on("console", (consoleObj) => (consoleOutput = consoleObj.text()));
    });
    beforeEach(() => {
        consoleOutput = "";
    });

    it("Server and Page initiated", async () => {
        const html = await page.content();
        await expect(html).toContain("tslog Demo");
    });

    it("pretty", async () => {
        await page.evaluate(() => {
            // @ts-ignore
            const logger = new timbergeist.Logger({ type: "pretty" });
            logger.silly("Test");
        });

        expect(consoleOutput).toContain("Test");
    });

    it("pretty no styles", async () => {
        await page.evaluate(() => {
            // @ts-ignore
            const logger = new timbergeist.Logger({ type: "pretty", stylePrettyLogs: false });
            logger.silly("Test");
        });

        expect(consoleOutput).toContain("Test");
    });

    it("pretty no styles undefined", async () => {
        await page.evaluate(() => {
            // @ts-ignore
            const logger = new timbergeist.Logger({ type: "pretty", stylePrettyLogs: false });
            logger.fatal("Test undefined", { test: undefined });
        });

        expect(consoleOutput).toContain("Test undefined");
    });

    it("pretty string interpolation", async () => {
        await page.evaluate(() => {
            // @ts-ignore
            const logger = new timbergeist.Logger({ type: "pretty", stylePrettyLogs: false });
            logger.info("Foo %s", "bar");
        });

        expect(consoleOutput).toContain("Foo bar");
    });
});
