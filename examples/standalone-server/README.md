# Standalone Server Example

This example demonstrates how to create a standalone MCP server using the OpenAPI-to-MCP library.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export MUSEUM_USER="your-username"
export MUSEUM_PASS="your-password"
export PORT=3000  # Optional, defaults to 3000
```

3. Start the server:
```bash
npm start
```

## Testing

The server will be available at:
- MCP endpoint: http://localhost:3000/mcp
- Health check: http://localhost:3000/health

## Features

- **Standalone Server**: Uses `MCPServer` class for complete server setup
- **Graceful Shutdown**: Handles SIGTERM and SIGINT signals
- **Environment Configuration**: Port and credentials configurable via environment
- **Built-in Health Check**: Automatic health endpoint
- **Error Handling**: Comprehensive error handling and logging

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