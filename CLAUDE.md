# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install all dependencies
- `npm run build` - Compile TypeScript to JavaScript (outputs to `dist/`)
- `npm run dev` - Run in development mode with hot-reloading using tsx
- `npm start` - Run the compiled server from dist/
- `npm run lint` - Run ESLint on TypeScript files
- `npm run typecheck` - Check TypeScript types without emitting files

## Architecture Overview

This is an MCP (Model Context Protocol) server that dynamically exposes OpenAPI specifications as callable tools. The architecture follows a request-driven pattern where OpenAPI operations are converted to MCP tools on-demand.

### Core Flow

1. **Lazy Initialization**: The OpenAPI spec is loaded from `OPENAPI_SPEC_URL` environment variable only when the first tool list request is received
2. **Dynamic Tool Generation**: Each OpenAPI operation is converted to an MCP tool with proper input schemas derived from parameters and request bodies
3. **Request Mapping**: When a tool is called, the server maps it back to the original OpenAPI operation and executes the HTTP request
4. **Parameter Handling**: Supports path parameters (URL substitution), query parameters, headers, and JSON request bodies

### Key Components in src/index.ts

- **loadOpenAPISpec()**: Fetches and parses OpenAPI specs (JSON/YAML) from URLs
- **convertOpenAPIToMCPTools()**: Transforms OpenAPI operations into MCP tool definitions
- **executeAPICall()**: Maps tool calls back to HTTP requests and executes them
- **Request Handlers**: 
  - ListToolsRequestSchema: Returns available tools
  - CallToolRequestSchema: Executes API calls

### Important Design Decisions

- Tool names are derived from `operationId` or generated as `{method}_{path}` with sanitized characters
- The first server URL in the OpenAPI spec is used as the base URL for all requests
- All API responses are returned as JSON, including error states with status codes
- The server uses stdio transport for MCP communication

## Configuration

The server requires the `OPENAPI_SPEC_URL` environment variable to be set. This should point to a valid OpenAPI 3.0 specification in JSON or YAML format.

When integrating with Claude Desktop, the configuration goes in:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`