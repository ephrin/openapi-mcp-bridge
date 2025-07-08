# Fastify Integration Example

This example demonstrates how to integrate the OpenAPI-to-MCP server with Fastify using a plugin.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export MUSEUM_USER="your-username"
export MUSEUM_PASS="your-password"
```

3. Start the server:
```bash
npm start
```

## Testing

The server will be available at:
- MCP endpoint: http://localhost:3000/mcp
- Health check: http://localhost:3000/health
- API documentation: http://localhost:3000/documentation
- Root: http://localhost:3000/

## Features

- **Fastify Plugin**: Uses `createFastifyPlugin()` to integrate MCP server
- **Built-in Logging**: Fastify's structured logging with pretty printing in development
- **Swagger Documentation**: Auto-generated API documentation at `/documentation`
- **Graceful Shutdown**: Handles SIGTERM and SIGINT signals properly
- **Error Handling**: Comprehensive error handling with structured responses
- **Environment Variables**: Configurable credentials via environment

## Architecture

The example uses:
- **Fastify**: High-performance Node.js web framework
- **Fastify Swagger**: For API documentation
- **MCP Plugin**: Registered with `/mcp` prefix
- **Structured Logging**: JSON logging with pretty printing in development

## Performance

Fastify is designed for high performance and includes:
- Fast JSON serialization
- Schema-based validation
- Efficient routing
- Plugin architecture

## API Definitions

The example includes:
- `museum-api.yaml` - OpenAPI definition
- `museum-api.custom.yaml` - Customization config

These are automatically converted to MCP tools when the server starts.

## Testing with MCP Inspector

Once the server is running, you can test it with the MCP Inspector:

```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector http://localhost:3000/mcp
```

## Development

For development with auto-reload:
```bash
npm run dev
```

This uses nodemon to watch for file changes and restart the server automatically.