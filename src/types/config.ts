// Core middleware logic (framework-agnostic)
export interface MiddlewareConfig {
    definitionDir?: string;
    parsedDefinitionsPath?: string; // DSN
    logger?: LoggerConfig;
}

export type LoggerConfig = {
    consoleFallback?: boolean; // default: true
    winston?: any; // default: undefined
    pino?: any; // Pino logger instance
}

export interface LibraryConfig {
  definitionsDirectory: string;
  cacheDirectory?: string;
  forceRegeneration?: boolean; // Skip cache and always regenerate
  logging?: LoggerConfig;
  defaultCredentials?: Record<string, any>;
  mcpOptions?: {
    serverName?: string;
    serverVersion?: string;
  };
}