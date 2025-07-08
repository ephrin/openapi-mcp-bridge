# Express Integration Example

This example demonstrates how to integrate the OpenAPI-to-MCP server with Express.js using middleware.

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

- **Express Middleware**: Uses `createExpressMiddleware()` to integrate MCP server
- **Health Check**: Endpoint to check service status and tool count
- **Environment Variables**: Configurable credentials via environment
- **API Definitions**: Uses museum API as example

## API Definitions

The example includes:
- `museum-api.yaml` - OpenAPI definition
- `museum-api.custom.yaml` - Customization config

These are automatically converted to MCP tools when the server starts.