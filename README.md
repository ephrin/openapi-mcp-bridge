# OpenAPI MCP Bridge

[![npm version](https://badge.fury.io/js/openapi-mcp-bridge.svg)](https://www.npmjs.com/package/openapi-mcp-bridge)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful Node.js/TypeScript library that automatically transforms OpenAPI definitions into MCP (Model Context Protocol) tools, enabling seamless integration between LLM clients and REST APIs.

## 🚀 Features

- **Automatic Tool Generation**: Scan directories and convert OpenAPI definitions to MCP tools
- **Intelligent Parameter Mapping**: Flatten path, query, and body parameters into unified MCP tool schemas
- **Smart Proxy**: Route MCP calls to actual APIs with proper parameter reconstruction
- **Framework Agnostic**: Works with Express, Koa, Fastify, or as standalone server
- **Hash-based Caching**: Automatic detection of definition changes with efficient caching
- **Authentication Support**: HTTP Basic, Bearer token, and API key authentication
- **Contextual Parameters**: Global and per-endpoint parameter defaults
- **Production Ready**: Comprehensive error handling, logging, TypeScript support

## 📦 Installation

```bash
npm install openapi-mcp-bridge
# or
yarn add openapi-mcp-bridge
# or
pnpm add openapi-mcp-bridge
```

## 🎯 Quick Start

### 1. Prepare Your API Definitions

Create a directory with your OpenAPI definitions:

```
api-definitions/
├── museum-api.yaml           # Your OpenAPI definition
└── museum-api.custom.yaml   # Optional customization
```

**museum-api.yaml** (OpenAPI definition):
```yaml
openapi: 3.1.0
info:
  title: Museum API
  version: 1.1.1
servers:
  - url: https://api.fake-museum-example.com/v1.1
paths:
  /museum-hours:
    get:
      summary: Get museum hours
      operationId: getMuseumHours
      parameters:
        - name: startDate
          in: query
          schema:
            type: string
            format: date
        - name: page
          in: query
          schema:
            type: integer
            default: 1
  /special-events:
    post:
      summary: Create special events
      operationId: createSpecialEvent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                location:
                  type: string
                dates:
                  type: array
                  items:
                    type: string
                    format: date
                price:
                  type: number
              required: [name, location, dates, price]
  /special-events/{eventId}:
    get:
      summary: Get special event
      operationId: getSpecialEvent
      parameters:
        - name: eventId
          in: path
          required: true
          schema:
            type: string
            format: uuid
security:
  - BasicAuth: []
components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
```

**museum-api.custom.yaml** (Optional customization):
```yaml
toolAliases:
  "get-museum-hours": "list-museum-hours"
  "post-special-events": "create-event"

predefinedParameters:
  global:
    page: 1
    limit: 10
  endpoints:
    "post-special-events":
      category: "educational"

authenticationOverrides:
  - endpoint: "*"
    credentials:
      username: "${MUSEUM_USER}"
      password: "${MUSEUM_PASS}"
```

### 2. Express Integration

```typescript
import express from 'express';
import { createExpressMiddleware } from 'openapi-mcp-bridge/express';

const app = express();

app.use('/mcp', createExpressMiddleware({
  definitionsDirectory: './api-definitions',
  defaultCredentials: {
    username: process.env.MUSEUM_USER,
    password: process.env.MUSEUM_PASS
  },
  logging: { consoleFallback: true }
}));

app.listen(3000, () => {
  console.log('MCP server available at http://localhost:3000/mcp');
});
```

### 3. Standalone Server

```typescript
import { MCPServer } from 'openapi-mcp-bridge';

const server = new MCPServer({
  definitionsDirectory: './api-definitions',
  port: 3000,
  mountPath: '/mcp'
});

await server.start();
```

### 4. CLI Usage

```bash
npx openapi-mcp-bridge \
  --definitions ./api-definitions \
  --port 3000 \
  --mount-path /mcp
```

## 🔧 Configuration

### Core Configuration

```typescript
interface LibraryConfig {
  definitionsDirectory: string;
  cacheDirectory?: string;
  logging?: {
    winston?: any;
    pino?: any;
    consoleFallback?: boolean;
  };
  defaultCredentials?: Record<string, any>;
  mcpOptions?: {
    serverName?: string;
    serverVersion?: string;
  };
}
```

### Logging Configuration

```typescript
import winston from 'winston';
import pino from 'pino';

const config = {
  logging: {
    winston: winstonInstance,     // Use Winston
    // OR
    pino: pinoInstance,          // Use Pino
    // OR
    consoleFallback: true        // Use console.log
  }
};
```

## 🎨 Customization

### Tool Aliases

Override default tool names:

```yaml
# museum-api.custom.yaml
toolAliases:
  "get-museum-hours": "list-hours"
  "post-special-events": "create-event"
  "get-special-events-by-eventId": "get-event-details"
```

### Predefined Parameters

Set default values that will be automatically applied:

```yaml
predefinedParameters:
  global:
    page: 1
    limit: 10
  endpoints:
    "post-special-events":
      category: "museum-event"
      organizer: "museum-staff"
    "get-museum-hours":
      format: "json"
```

### Authentication Overrides

Configure authentication credentials:

```yaml
authenticationOverrides:
  - endpoint: "*"  # Apply to all endpoints
    credentials:
      username: "${MUSEUM_USER}"
      password: "${MUSEUM_PASS}"
  - endpoint: "post-*"  # Apply to all POST operations
    credentials:
      token: "${ADMIN_TOKEN}"
```

## 🔌 Framework Integration

### Express

```typescript
import express from 'express';
import { createExpressMiddleware } from 'openapi-mcp-bridge/express';

const app = express();
app.use('/api/mcp', createExpressMiddleware(config));
```

### Koa

```typescript
import Koa from 'koa';
import { createKoaMiddleware } from 'openapi-mcp-bridge/koa';

const app = new Koa();
app.use(createKoaMiddleware(config));
```

### Fastify

```typescript
import Fastify from 'fastify';
import { createFastifyPlugin } from 'openapi-mcp-bridge/fastify';

const fastify = Fastify();
await fastify.register(createFastifyPlugin(config));
```

## 🔐 Authentication

### Supported Authentication Types

- **HTTP Basic**: Username/password authentication
- **HTTP Bearer**: Token-based authentication  
- **API Key**: Header, query parameter, or cookie-based keys

### Configuration Examples

**Basic Authentication:**
```yaml
# In your .custom.yaml
authenticationOverrides:
  - endpoint: "*"
    credentials:
      username: "api-user"
      password: "secret-password"
```

**Bearer Token:**
```yaml
authenticationOverrides:
  - endpoint: "*"
    credentials:
      token: "your-bearer-token"
```

**API Key:**
```yaml
authenticationOverrides:
  - endpoint: "*"
    credentials:
      key: "your-api-key"
```

## 🔄 Tool Naming & Parameter Mapping

### Naming Convention

The library automatically generates tool names based on HTTP method and path:

- `GET /museum-hours` → `get-museum-hours`
- `POST /special-events` → `post-special-events`
- `GET /special-events/{eventId}` → `get-special-events-by-eventId`
- `DELETE /tickets/{ticketId}` → `delete-tickets-by-ticketId`

### Parameter Flattening

All parameters (path, query, body) are flattened into a single MCP tool input schema:

**OpenAPI Definition:**
```yaml
/special-events/{eventId}:
  patch:
    parameters:
      - name: eventId
        in: path
        required: true
        schema:
          type: string
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
              location:
                type: string
```

**Generated MCP Tool:**
```json
{
  "name": "patch-special-events-by-eventId",
  "inputSchema": {
    "type": "object",
    "properties": {
      "eventId": { "type": "string" },
      "name": { "type": "string" },
      "location": { "type": "string" }
    },
    "required": ["eventId"]
  }
}
```

## 🧪 Testing Your MCP Server

### Using MCP Inspector

```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector http://localhost:3000/mcp
```

### Using Cursor IDE

1. Open Cursor settings
2. Add MCP server configuration:
```json
{
  "mcpServers": {
    "museum-api": {
      "command": "node",
      "args": ["path/to/your/mcp-server.js"]
    }
  }
}
```

### Using Claude Desktop

Update your Claude Desktop configuration:
```json
{
  "mcpServers": {
    "museum-api": {
      "command": "npx",
      "args": ["openapi-mcp-bridge", "--definitions", "./api-definitions", "--port", "3000"]
    }
  }
}
```

### Example LLM Interaction

After connecting to your MCP server, you can ask the LLM:

> "Create a special event called 'Contemporary Art Exhibition' at the Main Gallery for next Friday, and then buy 2 tickets for Alice and Bob"

The LLM will use the generated tools:
1. `post-special-events` to create the event
2. `post-tickets` to purchase tickets

## 📁 Project Structure

```
your-project/
├── api-definitions/
│   ├── museum-api.yaml
│   ├── museum-api.custom.yaml
│   ├── museum-api.enriched.json     # Auto-generated
│   ├── museum-api.hash              # Auto-generated
│   └── .cache/                      # Auto-generated cache
│       └── abc123def/
│           └── metadata.json
├── src/
│   └── server.ts
└── package.json
```

## 🔍 Debugging & Monitoring

### Debug Mode

```typescript
const config = {
  logging: {
    consoleFallback: true
  },
  debug: true // Enables detailed request/response logging
};
```

### Health Check

```typescript
app.get('/health', (req, res) => {
  const service = req.mcpService; // Available via middleware
  const status = service.getStatus();
  res.json({
    status: 'healthy',
    toolCount: status.tools.length,
    definitionsLoaded: status.definitions.length
  });
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/ephrin/openapi-mcp-bridge/blob/main/CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/ephrin/openapi-mcp-bridge.git
cd openapi-mcp-bridge
npm install
npm run build
npm test
```

### Running Examples

```bash
cd examples/museum-api
npm start
# Visit http://localhost:3000/mcp
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/ephrin/openapi-mcp-bridge/blob/main/LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) for the MCP specification
- [OpenAPI Initiative](https://www.openapis.org/) for the OpenAPI specification
- [ReadMe OpenAPI Parser](https://github.com/readmeio/oas) for robust OpenAPI parsing

## 📞 Support

- 📖 [Documentation](https://github.com/ephrin/openapi-mcp-bridge/wiki)
- 🐛 [Issues](https://github.com/ephrin/openapi-mcp-bridge/issues)
- 💬 [Discussions](https://github.com/ephrin/openapi-mcp-bridge/discussions)

---

Made with ❤️ for the LLM and API integration community