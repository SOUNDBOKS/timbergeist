import "ts-jest";
import { Logger } from "../../src/index.js";

describe("Transports", () => {
    test("attach one transport", (): void => {
        const transports: any[] = [];
        const logger = new Logger();
        logger.attachTransport({ transport: (logObj) => {
            transports.push(logObj);
        }});

        const logMsg = logger.info("string", 0, { test: 123 });

        expect(logMsg).toMatchObject(transports[0]);
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

        const logMsg = logger.info("string", 0, { test: 123 });

        expect(logMsg).toMatchObject(transports[0]);
        expect(logMsg).toMatchObject(transports[1]);
    });
});
