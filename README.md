# OpenAPI MCP Bridge

[![npm version](https://badge.fury.io/js/openapi-mcp-bridge.svg)](https://www.npmjs.com/package/openapi-mcp-bridge)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Transform OpenAPI definitions into MCP (Model Context Protocol) tools for seamless LLM-API integration.

## What is MCP?

**Model Context Protocol (MCP)** is a standard protocol that allows AI models to interact with external tools and data sources. Unlike REST APIs that use HTTP requests, MCP uses JSON-RPC messages over stdio or WebSocket connections.

**Key Differences:**
- **REST API**: HTTP requests → JSON responses
- **MCP**: JSON-RPC messages → Tool calls and responses
- **Purpose**: MCP bridges AI models with external systems safely and efficiently

**Why OpenAPI → MCP?**
- Your APIs are already documented in OpenAPI format
- AI models can't directly call REST APIs
- MCP provides a secure, standardized way to expose API functionality to AI

## Quick Start (30 seconds)

### 1. Install and Run
```bash
npm install -g openapi-mcp-bridge
mkdir my-api && cd my-api
```

### 2. Create OpenAPI Definition
```bash
cat > museum-api.yaml << 'EOF'
openapi: 3.1.0
info:
  title: Museum API
  version: 1.0.0
servers:
  - url: https://redocly.com/_mock/demo/openapi/museum-api
paths:
  /museum-hours:
    get:
      summary: Get museum hours
      operationId: getMuseumHours
      parameters:
        - name: date
          in: query
          schema:
            type: string
            format: date
components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
EOF
```

### 3. Test with MCP Inspector
```bash
# Terminal 1: Start MCP server
openapi-mcp-bridge --definitions .

# Terminal 2: Test with inspector
npm install -g @modelcontextprotocol/inspector
mcp-inspector npx openapi-mcp-bridge --definitions .
```

**Result**: You'll see `getMuseumHours` tool available in the MCP Inspector interface.

## Integration Examples

### Claude Desktop Integration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "museum-api": {
      "command": "npx",
      "args": ["openapi-mcp-bridge", "--definitions", "/path/to/your/api-definitions"]
    }
  }
}
```

**Usage**: Ask Claude "What are the museum hours?" and it will automatically call your API.

### Claude Code Integration

1. Create `.claude-code-mcp.json` in your project:
```json
{
  "mcpServers": {
    "my-api": {
      "command": "npx",
      "args": ["openapi-mcp-bridge", "--definitions", "./api-definitions"]
    }
  }
}
```

2. Claude Code will automatically detect and use your API tools.

### Custom MCP Client

```typescript
// TypeScript example with proper ES module setup
import { spawn } from 'child_process';
import { MCPClient } from '@modelcontextprotocol/client';

const serverProcess = spawn('npx', ['openapi-mcp-bridge', '--definitions', './api-definitions']);
const client = new MCPClient();

await client.connect({ 
  stdio: { 
    stdin: serverProcess.stdin, 
    stdout: serverProcess.stdout 
  } 
});

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Call a tool
const result = await client.callTool('getMuseumHours', { date: '2024-01-15' });
console.log('Result:', result);
```

## Usage Patterns

### When to Use Each Approach

| Use Case | Approach | Best For |
|----------|----------|----------|
| **AI Model Integration** | CLI (`openapi-mcp-bridge`) | Claude Desktop, Claude Code, custom MCP clients |
| **Web Application** | Express/Fastify middleware | Adding MCP endpoints to existing web apps |
| **Microservice** | Standalone server | Dedicated MCP service, Docker deployments |
| **Development/Testing** | MCP Inspector | Testing and debugging MCP tools |

### Decision Tree

```
Do you want to integrate with an AI model?
├── Yes → Use CLI approach
│   ├── Claude Desktop → Update claude_desktop_config.json
│   ├── Claude Code → Create .claude-code-mcp.json
│   └── Custom client → Use stdio connection
└── No → Use HTTP approach
    ├── Existing Express app → Use Express middleware
    ├── New microservice → Use standalone server
    └── Testing → Use MCP Inspector
```

## Troubleshooting

### Common Issues

#### 1. Import Path Errors
```bash
# ❌ Error: Cannot find module 'openapi-mcp-bridge/express'
import { createExpressMiddleware } from 'openapi-mcp-bridge/express';

# ✅ Solution: Use the correct package exports
import { createExpressMiddleware } from 'openapi-mcp-bridge/express';
```

**Root Cause**: Package uses ES modules. Ensure your `package.json` has `"type": "module"`.

#### 2. "Cannot POST /mcp" Error
```bash
# ❌ Wrong: Trying to make HTTP requests to MCP endpoint
curl -X POST http://localhost:3000/mcp

# ✅ Right: Use MCP Inspector or MCP client
mcp-inspector http://localhost:3000/mcp
```

**Root Cause**: MCP is not a REST API. It uses JSON-RPC over stdio/WebSocket.

#### 3. Port Conflicts
```bash
# ❌ Error: EADDRINUSE: address already in use :::3000
npm start

# ✅ Solution: Use a different port
PORT=3001 npm start
# or
npx openapi-mcp-bridge --definitions . --port 3001
```

#### 4. CLI Warnings
```bash
# ❌ Warning: --port is not yet implemented in stdio mode
openapi-mcp-bridge --definitions . --port 3000

# ✅ Solution: Don't use --port with CLI (stdio mode)
openapi-mcp-bridge --definitions .
```

**Root Cause**: CLI runs in stdio mode for MCP clients. Use standalone server for HTTP mode.

#### 5. Module Import Issues
```typescript
// ❌ CommonJS in ES module project
const { createExpressMiddleware } = require('openapi-mcp-bridge/express');

// ✅ ES modules syntax
import { createExpressMiddleware } from 'openapi-mcp-bridge/express';
```

**Setup for TypeScript projects**:
```json
// package.json
{
  "type": "module",
  "scripts": {
    "start": "tsx src/server.ts"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "node",
    "target": "ES2022",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Debug Mode

Enable detailed logging:
```bash
# CLI
openapi-mcp-bridge --definitions . --debug

# Environment variable
DEBUG=true openapi-mcp-bridge --definitions .

# Programmatic
const config = {
  logging: { consoleFallback: true },
  debug: true
};
```

### Validation Issues

```bash
# Check if OpenAPI file is valid
npx @redocly/cli lint your-api.yaml

# Force cache regeneration
OPENAPI_FORCE_REGEN=true openapi-mcp-bridge --definitions .

# Test tool generation
mcp-inspector npx openapi-mcp-bridge --definitions .
```

## Advanced Usage

### Express Integration

```typescript
// server.ts
import express from 'express';
import { createExpressMiddleware } from 'openapi-mcp-bridge/express';

const app = express();

// Add MCP endpoint
app.use('/mcp', createExpressMiddleware({
  definitionsDirectory: './api-definitions',
  defaultCredentials: {
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD
  }
}));

// Add health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(3000, () => {
  console.log('MCP server: http://localhost:3000/mcp');
});
```

### Standalone Server

```typescript
import { MCPServer } from 'openapi-mcp-bridge';

const server = new MCPServer({
  definitionsDirectory: './api-definitions',
  port: 3000,
  mountPath: '/mcp',
  defaultCredentials: {
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD
  }
});

await server.start();
console.log('MCP server running on http://localhost:3000/mcp');
```

### Configuration

```typescript
interface Config {
  definitionsDirectory: string;
  cacheDirectory?: string;
  defaultCredentials?: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
  };
  logging?: {
    winston?: any;
    pino?: any;
    consoleFallback?: boolean;
  };
  mcpOptions?: {
    serverName?: string;
    serverVersion?: string;
  };
}
```

## 📁 Project Structure

```
your-project/
├── api-definitions/
│   ├── museum-api.yaml          # OpenAPI specification
│   ├── museum-api.custom.yaml   # Optional customization
│   └── .cache/                  # Auto-generated cache
├── src/
│   └── server.ts               # Your server code
├── package.json                # {"type": "module"}
└── tsconfig.json               # ES2022 modules
```

## 🔐 Authentication

Supports HTTP Basic, Bearer tokens, and API keys:

```yaml
# museum-api.custom.yaml
authenticationOverrides:
  - endpoint: "*"
    credentials:
      username: "${API_USERNAME}"
      password: "${API_PASSWORD}"
```

## 🧪 Testing

```bash
# Test tool generation
npm install -g @modelcontextprotocol/inspector
mcp-inspector npx openapi-mcp-bridge --definitions ./api-definitions

# Validate OpenAPI specs
npx @redocly/cli lint api-definitions/*.yaml

# Test with real API calls
node -e "
import { MCPClient } from '@modelcontextprotocol/client';
// ... client code
"
```

## 📝 Examples

- [Express Integration](examples/express-integration/)
- [Standalone Server](examples/standalone-server/)
- [CLI Usage](examples/cli-usage/)
- [Claude Desktop Setup](examples/claude-desktop/)
- [Complete Museum API](examples/museum-api/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) for the MCP specification
- [OpenAPI Initiative](https://www.openapis.org/) for the OpenAPI specification
- [ReadMe OpenAPI Parser](https://github.com/readmeio/oas) for robust OpenAPI parsing

---

**Need help?** Check our [troubleshooting guide](#troubleshooting) or [open an issue](https://github.com/ephrin/openapi-mcp-bridge/issues).