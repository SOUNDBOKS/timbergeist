let consoleOutput = "";

export function mockConsoleLog(resetConsoleOutput = false, printConsole = false) {
    const storeLog = (inputs: unknown) => {
        if (printConsole) {
            process.stdout.write("console.log: " + inputs + "\n");
        }
        consoleOutput += inputs;
    };
    const storeError = (inputs: unknown) => {
        if (printConsole) {
            process.stdout.write("console.error: " + inputs + "\n");
        }
        consoleOutput += inputs;
    }
    console["log"] = jest.fn(storeLog);
    console["error"] = jest.fn(storeError);
    if (resetConsoleOutput) {
        consoleOutput = "";
    }
}

export function getConsoleOutput() {
    return consoleOutput;
}
