# CLI Usage Example

This example demonstrates how to use the OpenAPI-to-MCP server via command line interface.

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

## Running with CLI

### Basic Usage
```bash
npm start
```
This runs:
```bash
npx openapi-mcp-bridge --definitions ./api-definitions --port 3000 --mount-path /mcp
```

### With Debug Mode
```bash
npm run start:debug
```

### Custom Port
```bash
npm run start:custom-port
```
Runs on port 8080 instead of 3000.

### No Caching
```bash
npm run start:no-cache
```
Disables caching for development.

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--definitions <dir>` | Directory containing OpenAPI definitions | `./definitions` |
| `--port <number>` | Port to run server on | `3000` |
| `--mount-path <path>` | Path to mount MCP endpoints | `/` |
| `--cache-dir <dir>` | Directory for caching | `./definitions/.cache` |
| `--no-cache` | Disable caching | `false` |
| `--debug` | Enable debug logging | `false` |
| `--help` | Show help | |

## Direct CLI Usage

You can also run the CLI directly without npm scripts:

```bash
# Basic usage
npx openapi-mcp-bridge --definitions ./api-definitions

# With all options
npx openapi-mcp-bridge \
  --definitions ./api-definitions \
  --port 3000 \
  --mount-path /mcp \
  --cache-dir ./cache \
  --debug

# Environment variables
MUSEUM_USER=user MUSEUM_PASS=pass npx openapi-mcp-bridge --definitions ./api-definitions
```

## Testing

Once running, the server will be available at:
- MCP endpoint: http://localhost:3000/mcp
- Health check: http://localhost:3000/health

Test with MCP Inspector:
```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector http://localhost:3000/mcp
```

## Integration with Claude Desktop

Add to your Claude Desktop configuration:
```json
{
  "mcpServers": {
    "museum-api": {
      "command": "npx",
      "args": [
        "openapi-mcp-server", 
        "--definitions", 
        "./path/to/api-definitions", 
        "--port", 
        "3000"
      ]
    }
  }
}
```