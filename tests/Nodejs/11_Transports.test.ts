import "ts-jest";
import { Logger } from "../../src/index.js";

describe("Transports", () => {
    test("attach one transport", (): void => {
        const transports: any[] = [];
        const logger = new Logger();
        logger.attachTransport({ transport: (logObj) => {
            transports.push(logObj);
        }});

        logger.info("string", 0, { test: 123 });

        expect(transports[0]).toMatchObject({
            "0": "string",
            "1": 0,
            "2": { test: 123 },
        });
    });

    test("attach two transport", (): void => {
        const transports: any[] = [];
        const logger = new Logger();
        logger.attachTransport({transport: (logObj) => {
            transports.push(logObj);
        }});
        logger.attachTransport({transport: (logObj) => {
            transports.push(logObj);
        }});

        logger.info("string", 0, { test: 123 });

        expect(transports[0]).toMatchObject({
            "0": "string",
            "1": 0,
            "2": { test: 123 },
        });
        expect(transports[1]).toMatchObject({
            "0": "string",
            "1": 0,
            "2": { test: 123 },
        });
    });
});
