# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install all dependencies
- `npm run build` - Compile TypeScript to JavaScript (outputs to `dist/`)
- `npm run dev` - Run in development mode with hot-reloading using tsx
- `npm start` - Run the compiled server from dist/
- `npm run server` - Run the HTTP-based development server
- `npm run lint` - Run ESLint on TypeScript files
- `npm run typecheck` - Check TypeScript types without emitting files

## Architecture Overview

This is an MCP (Model Context Protocol) server that dynamically exposes OpenAPI specifications as callable tools. The project supports multiple deployment modes: as a stdio-based MCP server, HTTP server, or integrated into Express/Koa/Fastify applications.

### Core Architecture

The project follows a modular, service-oriented architecture:

1. **Definition Loading**: OpenAPI specifications are loaded from a definitions directory
2. **Parsing & Enrichment**: Specs are parsed, references resolved, and enriched with customizations
3. **Tool Generation**: Each OpenAPI operation is converted to an MCP tool with proper schemas
4. **Request Execution**: Tool calls are mapped back to HTTP API requests
5. **Response Handling**: API responses are normalized and returned as tool results

### Key Components

#### Core Service (`src/services/mcp-proxy-service.ts`)
- **MCPProxyService**: Orchestrates all functionality
  - Loads and manages multiple OpenAPI definitions from a directory
  - Converts OpenAPI operations to MCP tools via enrichers and converters
  - Executes tool calls by mapping them to HTTP requests
  - Handles authentication and parameter validation

#### Parsers (`src/parsers/`)
- **OpenAPIDefinitionParser**: Parses and validates OpenAPI 3.0 specifications
  - Uses `@readme/openapi-parser` for reference resolution
  - Extracts paths, parameters, request bodies, and security schemes
- **CustomizationLoader**: Loads `.custom.yaml` files for per-definition configuration
  - Tool aliases and descriptions
  - Predefined parameters
  - Authentication credentials

#### Converters & Enrichers (`src/converters/`, `src/enrichers/`)
- **SchemaConverter**: Converts OpenAPI schemas to MCP input schemas
  - Flattens complex request bodies into tool parameters
  - Handles all parameter types (path, query, header, cookie)
  - Applies predefined parameters from customizations
- **DefinitionEnricher**: Enriches parsed definitions with metadata
  - Generates tool names using ToolNameGenerator
  - Applies customizations
  - Manages caching of enriched definitions

#### Handlers (`src/handlers/`)
- **AuthenticationHandler**: Manages API authentication
  - Supports basic, bearer, and API key authentication
  - Merges default and tool-specific credentials
  - Handles security scheme requirements

#### Entry Points
- **`src/index.ts`**: Main module exports for library usage
- **`src/server.ts`**: Stdio-based MCP server (default mode)
- **`src/cli.ts`**: Command-line interface wrapper
- **`server/main.ts`**: HTTP-based development server

### Framework Integrations (`src/integrations/`)

All integrations follow a middleware/plugin pattern:

- **Express**: Middleware that handles POST requests with JSON-RPC
- **Koa**: Context-based middleware for Koa applications  
- **Fastify**: Plugin that decorates the Fastify instance
- **Standalone**: Full Express server with health endpoints

## Configuration

### Environment Variables

For stdio server mode:
- `OPENAPI_DEFINITIONS_DIR`: Directory containing OpenAPI specifications (required)
- `OPENAPI_CACHE_DIR`: Cache directory for enriched definitions (optional)
- `OPENAPI_FORCE_REGEN`: Force regeneration of cached definitions (optional)

For authentication:
- `OPENAPI_USERNAME`: Default username for basic auth
- `OPENAPI_PASSWORD`: Default password for basic auth
- `OPENAPI_TOKEN`: Default bearer token
- `OPENAPI_API_KEY`: Default API key

### Library Configuration

When using as a library, pass a `LibraryConfig` object:

```typescript
{
  definitionsDirectory: string;      // Directory with OpenAPI specs
  cacheDirectory?: string;           // Optional cache directory
  forceRegeneration?: boolean;       // Force cache refresh
  defaultCredentials?: {             // Default auth credentials
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
  };
  mcpOptions?: {                     // MCP server metadata
    name?: string;
    version?: string;
  };
}
```

### Customization Files

Place `.custom.yaml` files alongside OpenAPI specs for customization:

```yaml
tools:
  operationId:
    alias: "custom_tool_name"
    description: "Custom description"
    predefinedParameters:
      apiKey: "predefined-key"
credentials:
  username: "api-username"
  password: "api-password"
```

## Important Design Decisions

- **Directory-based Loading**: Supports multiple OpenAPI definitions in one server
- **Customization System**: Allows per-API configuration without modifying specs
- **Caching**: Enriched definitions are cached for performance
- **Tool Naming**: Generated from operationId or path/method combination
- **Authentication**: Supports multiple auth types with credential merging
- **Error Handling**: All errors are returned as structured tool results

## Testing

When implementing new features:
1. Check existing patterns in similar components
2. Ensure TypeScript types are properly defined
3. Run `npm run lint` and `npm run typecheck` before committing
4. Test with example OpenAPI specs in the `definitions/` directory