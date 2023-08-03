

# Timbergeist: A flexible typescript logging framework


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

### Reconstructing string logs from JSON log objects

```ts
import { ConsoleSink, PrettyPrinterTransport } from "@soundboks/tslog"

/// const json = logs[0] // one log object f.e.

const printer = new PrettyPrinterTransport(ConsoleSink, {
    prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}} {{name}} ",
});

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
