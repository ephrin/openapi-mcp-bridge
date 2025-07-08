import {LoggerConfig} from "./types/config.js";

type Logger = {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    debug: (message: string) => void;
}

let logger: Logger = {
    info: (message: string) => {},
    warn: (message: string) => {},
    error: (message: string) => {},
    debug: (message: string) => {},
};

export function createLogger(loggerConfig: LoggerConfig = { consoleFallback: true}) {
    if (!loggerConfig && logger) {
        return logger;
    }
    // todo add adapters
    if (!loggerConfig?.winston && loggerConfig.consoleFallback) {
        return logger = {
            info: (message: string) => console.log(`INFO: ${message}`),
            warn: (message: string) => console.warn(`WARN: ${message}`),
            error: (message: string) => console.error(`ERROR: ${message}`),
            debug: (message: string) => console.debug(`DEBUG: ${message}`),
        };
    }

    return logger;
}