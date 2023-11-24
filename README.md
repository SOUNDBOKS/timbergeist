

# Timbergeist: A flexible typescript logging framework

## Features

🪶 Lightweight (1 runtime dependency)  
🏗 Universal: Works in Browsers and Node.js  
👮‍️ Fully typed even with custom Metadata  
🗃 Structured logging - JSON-first with built in pretty print transforms  
🦸 Plugable transports and transformers  
🤓 Stack trace and pretty errors  
👨‍👧‍👦 Child-logging hierarchies with proper feed-through  

## Design Rationale

### Log Object Format

In Timbergeist logs are represented by a collection of javascript objects. There is not concept of a format strings or log id etc. Timbergeist is built to be flexible enough that these features can be built on top in a straight forward way.  
  
Once serialised, the object structure could look something like this:
```json
{
    "0": { "foo": 0, "bar": { "cee": 5 }},
    "1": "Hello logs!",
    "_meta": {
        "__tgLogFormatVersion": 1,
        "logLevelId": 3,
        "logLevelName": "INFO",
        ...
    }
}
```


## Usage

### Quickstart

```ts
import { Logger } from "@soundboks/timbergeist"

const RootLogger = new Logger()

RootLogger.info("Hello World")
```

### Custom Transports with different logs

In this example we submit JSON logs to a HTTP endpoint and still pretty print logs to the console. We also make sure to submit all log levels via HTTP, but only print level 3 or higher to the console to avoid clutter.

```ts
import { ConsoleSink, Logger, PrettyPrinterTransport } from "@soundboks/timbergeist";

const LOG_LEVEL_INFO = 3;
const LOG_LEVEL_DEBUG = 2;

// our "hidden" logger which is actually responsible for printing
const _RootLogger = new Logger(
	{
		minLevel: process.env["NODE_ENV"] === "production" ? LOG_LEVEL_INFO : LOG_LEVEL_DEBUG,
	},
	[
		new PrettyPrinterTransport(ConsoleSink, {
			prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}} {{name}} ",
		}),
	]
);

// our exported Root Logger, which has a lower minLevel than our hidden logger
export const RootLogger = _RootLogger.getSubLogger({
	minLevel: 0,
});

RootLogger.attachTransport({
	transport(logArgs, meta) {
        const message = {
            ...logArgs,
            _meta: meta,
        }

        // In a real application you should use a batching mechanism of some sort
        fetch("https://api.foobar.com/logs/intake", {
            Body: JSON.stringify(message)
        })
    }
});
```


### Reconstructing string logs from JSON log objects

```ts
import { ConsoleSink, PrettyPrinterTransport } from "@soundboks/tslog"

const printer = new PrettyPrinterTransport(ConsoleSink, {
    prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}} {{name}} ",
});

const log = MY_LOGS[0] // one log object in timbergeist format
const collectedArgs: unknown[] = []
for (let i = 0; Object.keys(log).includes(i.toString()); i++) {
    collectedArgs.push(log[i])
}

printer.transport(collectedArgs, log._meta)
```





### Differences from Tslog

- Masking as a feature has been removed entirely

## Acknowledgements

Timbergeist started out as a internal fork of [Tslog](https://github.com/fullstack-build/tslog).
