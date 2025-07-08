// Main exports for the @ephrin/openapi-mcp-server package

// Core service
export { MCPProxyService } from './services/mcp-proxy-service.js';

// Types
export type { 
  LibraryConfig,
  LoggerConfig,
  MiddlewareConfig
} from './types/config.js';

export type {
  ParsedDefinition,
  ParsedPath,
  ParsedParameter,
  ParsedRequestBody,
  SecurityScheme,
  CustomizationConfig,
  EnrichedDefinition,
  ToolDefinition,
  ValidationResult,
  HttpRequest,
  MCPTool
} from './types/openapi-mcp.types.js';

export { 
  MCPProxyError, 
  ErrorType 
} from './types/errors.js';

// Parsers
export { OpenAPIDefinitionParser } from './parsers/openapi-parser.js';
export { CustomizationConfigLoader } from './parsers/customization-loader.js';

// Enrichers
export { DefinitionEnricher } from './enrichers/definition-enricher.js';

// Generators
export { ToolNameGenerator } from './generators/tool-name-generator.js';

// Converters
export { SchemaConverter } from './converters/schema-converter.js';

// Handlers
export { AuthenticationHandler } from './handlers/authentication-handler.js';

// Re-export the server executable for backward compatibility
export { default as runServer } from './server.js';

// Framework integrations
export { createExpressMiddleware } from './integrations/express.js';
export { createKoaMiddleware } from './integrations/koa.js';
export { createFastifyPlugin } from './integrations/fastify.js';
export { MCPServer } from './integrations/standalone.js';