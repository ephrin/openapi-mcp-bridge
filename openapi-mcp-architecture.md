# OpenAPI-to-MCP Server Library

## Overview

A Node.js/TypeScript library that dynamically generates MCP (Model Context Protocol) tools from OpenAPI definitions, providing seamless integration between LLM clients and REST APIs through intelligent proxy mapping.

## Architecture Design

### Core Layers

```
┌─────────────────────────────────────────┐
│         Integration Layer               │
│  ┌─────────────┬─────────────┬─────────┐│
│  │ Express     │ Standalone  │   CLI   ││
│  │ Middleware  │   Server    │  Tool   ││
│  └─────────────┴─────────────┴─────────┘│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│           Runtime Engine                │
│  ┌─────────────────────────────────────┐│
│  │        MCPProxyService              ││
│  │  (Tool Registry + Proxy Engine)     ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│        Definition Processing            │
│  ┌─────────────┬─────────────┬─────────┐│
│  │ OpenAPI     │ Config      │ Cache   ││
│  │ Parser      │ Merger      │ Manager ││
│  └─────────────┴─────────────┴─────────┘│
└─────────────────────────────────────────┘
```

### Component Specifications

#### 1. Definition Processing Layer

**OpenAPIDefinitionParser**
```typescript
interface ParsedDefinition {
  servers: string[];
  paths: ParsedPath[];
  security: SecurityScheme[];
  hash: string;
}

interface ParsedPath {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters: ParsedParameter[];
  requestBody?: ParsedRequestBody;
  responses: Record<string, any>;
}

interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  schema: any;
  description?: string;
}

interface ParsedRequestBody {
  required: boolean;
  content: Record<string, { schema: any }>;
}

interface SecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2';
  scheme?: string; // for http type
  in?: 'header' | 'query' | 'cookie'; // for apiKey
  name?: string; // for apiKey
}
```

**CustomizationConfig**
```typescript
interface CustomizationConfig {
  toolAliases?: Record<string, string>;
  predefinedParameters?: {
    global?: Record<string, any>;
    endpoints?: Record<string, Record<string, any>>;
  };
  authenticationOverrides?: {
    endpoint: string; // "*" for all, or specific tool name
    credentials: Record<string, any>;
  }[];
}
```

**EnrichedDefinition (Cached JSON)**
```typescript
interface EnrichedDefinition {
  hash: string;
  serverUrl: string;
  security: SecurityScheme[];
  tools: ToolDefinition[];
  metadata: {
    sourceFile: string;
    customFile?: string;
    generatedAt: string;
  };
}

interface ToolDefinition {
  name: string; // e.g., "get-special-events-by-eventId"
  description: string;
  method: string;
  endpoint: {
    path: string; // e.g., "/special-events/{eventId}"
    url: string;  // full URL with server
  };
  inputSchema: any; // JSON Schema for MCP tool
  parameterMapping: {
    pathParams: Record<string, string>; // param name -> path position
    queryParams: string[];
    bodySchema?: any;
  };
  authentication?: {
    type: string;
    credentials: Record<string, any>;
  };
  predefinedParams: Record<string, any>;
}
```

#### 2. Runtime Engine Layer

**MCPProxyService (Single Class)**
```typescript
class MCPProxyService {
  constructor(private config: LibraryConfig) {}
  
  // MCP Tool Registry functionality
  getAvailableTools(): MCPTool[];
  
  // Tool execution (combines MCP + Proxy)
  async executeTool(toolName: string, parameters: any): Promise<any>;
  
  // Internal methods
  private loadEnrichedDefinition(filePath: string): EnrichedDefinition;
  private validateParameters(tool: ToolDefinition, params: any): ValidationResult;
  private buildHttpRequest(tool: ToolDefinition, params: any): HttpRequest;
  private applyAuthentication(request: HttpRequest, auth: any): HttpRequest;
  private executeHttpRequest(request: HttpRequest): Promise<any>;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema
}

interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### Tool Naming & Parameter Mapping Strategy

Based on the museum API example:

**Tool Naming Convention:**
- Include path parameters in tool name: `GET /special-events/{eventId}` → `get-special-events-by-eventId`
- Remove path parameters from MCP tool parameters
- Flatten query and body parameters into single input schema

**Examples:**
```typescript
// GET /museum-hours?startDate=X&page=Y&limit=Z
{
  name: "get-museum-hours",
  inputSchema: {
    type: "object",
    properties: {
      startDate: { type: "string", format: "date" },
      page: { type: "integer", default: 1 },
      limit: { type: "integer", default: 10 }
    }
  }
}

// GET /special-events/{eventId}
{
  name: "get-special-events-by-eventId", 
  inputSchema: {
    type: "object",
    properties: {
      eventId: { type: "string", format: "uuid" }
    },
    required: ["eventId"]
  }
}

// POST /tickets with body
{
  name: "post-tickets",
  inputSchema: {
    type: "object", 
    properties: {
      ticketType: { type: "string", enum: ["event", "general"] },
      eventId: { type: "string", format: "uuid" },
      ticketDate: { type: "string", format: "date" },
      email: { type: "string", format: "email" },
      phone: { type: "string" }
    },
    required: ["ticketType", "ticketDate", "email"]
  }
}
```

### Authentication Implementation

**Simple Authentication Handler:**
```typescript
class AuthenticationHandler {
  applyAuth(request: HttpRequest, scheme: SecurityScheme, credentials: any): HttpRequest {
    switch (scheme.type) {
      case 'http':
        if (scheme.scheme === 'basic') {
          const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
          request.headers['Authorization'] = `Basic ${auth}`;
        }
        if (scheme.scheme === 'bearer') {
          request.headers['Authorization'] = `Bearer ${credentials.token}`;
        }
        break;
        
      case 'apiKey':
        if (scheme.in === 'header') {
          request.headers[scheme.name!] = credentials.key;
        }
        // handle query/cookie cases
        break;
    }
    return request;
  }
}
```

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

### File Structure & Caching

```
definitions/
├── museum-api.yaml                    # OpenAPI definition
├── museum-api.custom.yaml            # Customization config
├── museum-api.enriched.json          # Generated enriched definition
├── museum-api.hash                   # Hash of definition + customization
└── .cache/
    └── {hash}/
        └── metadata.json             # Optional additional metadata
```

### Framework Integration

**Express Middleware:**
```typescript
function createExpressMiddleware(config: LibraryConfig): express.RequestHandler {
  const service = new MCPProxyService(config);
  
  return (req, res, next) => {
    if (req.path === '/tools') {
      res.json(service.getAvailableTools());
    } else if (req.path === '/call' && req.method === 'POST') {
      service.executeTool(req.body.name, req.body.arguments)
        .then(result => res.json(result))
        .catch(error => res.status(500).json({ error: error.message }));
    } else {
      next();
    }
  };
}
```

### Error Handling

```typescript
enum ErrorType {
  INVALID_OPENAPI = 'invalid_openapi',
  MISSING_TOOL = 'missing_tool',
  PARAMETER_VALIDATION = 'parameter_validation',
  AUTHENTICATION_FAILED = 'authentication_failed',
  API_REQUEST_FAILED = 'api_request_failed',
  NETWORK_ERROR = 'network_error'
}

class MCPProxyError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}
```

### Usage Examples

#### 1. Express Integration
```typescript
import express from 'express';
import { createExpressMiddleware } from 'openapi-mcp-server';

const app = express();

app.use('/mcp', createExpressMiddleware({
  definitionsDirectory: './api-definitions',
  defaultCredentials: {
    username: process.env.MUSEUM_USER,
    password: process.env.MUSEUM_PASS
  },
  logging: { consoleFallback: true }
}));
```

#### 2. Standalone Server
```typescript
import { MCPServer } from 'openapi-mcp-server';

const server = new MCPServer({
  definitionsDirectory: './api-definitions',
  port: 3000,
  mountPath: '/mcp'
});

await server.start();
```

#### 3. MCP Tool Usage
After setup, LLM clients see tools like:
- `get-museum-hours` - Get museum operating hours
- `post-special-events` - Create a special event
- `get-special-events-by-eventId` - Get details about a specific event
- `post-tickets` - Buy museum tickets

## Implementation Phases

### Phase 1: Core Infrastructure (MVP)
- [ ] OpenAPI parsing with @readme/oas-parser
- [ ] Basic tool generation with parameter flattening
- [ ] Simple HTTP proxy execution
- [ ] Express middleware integration
- [ ] Basic authentication (HTTP Basic/Bearer)

### Phase 2: Configuration & Caching
- [ ] Customization config merging
- [ ] Hash-based caching system
- [ ] Predefined parameter resolution
- [ ] Enhanced error handling

### Phase 3: Production Features
- [ ] Additional framework adapters (Koa, Fastify)
- [ ] CLI interface
- [ ] Comprehensive logging
- [ ] API key authentication

### Phase 4: Polish
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation & examples

## Dependencies

**Core:**
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `@readme/oas-parser` - OpenAPI definition parsing & validation
- `axios` - HTTP client for API proxying
- `yaml` - YAML configuration parsing

**Framework Support (peer dependencies):**
- `express` 
- `@koa/router`  
- `fastify`

**Development:**
- `typescript`
- `jest` - Testing
- `eslint` - Linting

This simplified architecture focuses on the core functionality while maintaining extensibility for future enhancements.