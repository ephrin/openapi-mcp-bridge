# Koa Integration Example

This example demonstrates how to integrate the OpenAPI-to-MCP server with Koa.js using middleware.

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
- Root: http://localhost:3000/

## Features

- **Koa Middleware**: Uses `createKoaMiddleware()` to integrate MCP server
- **Router Integration**: Demonstrates Koa Router usage alongside MCP
- **Body Parser**: Includes koa-bodyparser for request handling
- **Error Handling**: Comprehensive error handling middleware
- **Environment Variables**: Configurable credentials via environment

## Architecture

The example uses:
- **Koa.js**: Modern Node.js web framework
- **Koa Router**: For route management
- **Koa Body Parser**: For parsing request bodies
- **MCP Middleware**: Mounted at `/mcp` path

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