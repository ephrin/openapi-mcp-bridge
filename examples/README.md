# OpenAPI-to-MCP Examples

This directory contains comprehensive examples demonstrating different integration patterns and usage scenarios for the OpenAPI-to-MCP server.

## 📁 Available Examples

### 1. [Express Integration](./express-integration/)
- **Framework**: Express.js
- **Integration**: Middleware pattern
- **Features**: Health checks, error handling, environment configuration
- **Use Case**: Traditional web applications and REST APIs

### 2. [Standalone Server](./standalone-server/)
- **Framework**: Built-in server
- **Integration**: Direct MCPServer class usage
- **Features**: Graceful shutdown, comprehensive logging, health endpoints
- **Use Case**: Dedicated MCP servers and microservices

### 3. [CLI Usage](./cli-usage/)
- **Framework**: Command line interface
- **Integration**: npx/CLI commands
- **Features**: Multiple run scripts, environment configuration, debugging
- **Use Case**: Quick prototyping, development, CI/CD pipelines

### 4. [Koa Integration](./koa-integration/)
- **Framework**: Koa.js
- **Integration**: Middleware pattern with modern async/await
- **Features**: Router integration, body parsing, error handling
- **Use Case**: Modern Node.js applications with async patterns

### 5. [Fastify Integration](./fastify-integration/)
- **Framework**: Fastify
- **Integration**: Plugin architecture
- **Features**: High performance, built-in validation, Swagger docs
- **Use Case**: High-performance applications requiring speed and efficiency

### 6. [Museum API](./museum-api/) ⭐ **Complete Reference**
- **Framework**: Direct service usage
- **Integration**: Comprehensive example with all features
- **Features**: Full test suite, multiple endpoints, authentication, caching
- **Use Case**: Reference implementation and learning resource

## 🚀 Quick Start

Each example includes:
- `package.json` with dependencies and run scripts
- `README.md` with detailed setup instructions
- `api-definitions/` with OpenAPI specs and customization
- `.env.example` with environment variable templates

### Basic Setup Pattern

1. **Navigate to any example**:
   ```bash
   cd examples/express-integration  # or any other example
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

## 🧪 Testing Examples

### Museum API (Recommended for testing)
The museum-api example includes a comprehensive test suite:

```bash
cd examples/museum-api
npm install
npm test
```

### MCP Inspector Testing
For any running example:

```bash
npm install -g @modelcontextprotocol/inspector
mcp-inspector http://localhost:3000/mcp
```

### Claude Desktop Integration
Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "museum-api": {
      "command": "node",
      "args": ["path/to/examples/museum-api/server.js"],
      "env": {
        "MUSEUM_USER": "your-username",
        "MUSEUM_PASS": "your-password"
      }
    }
  }
}
```

## 📊 Comparison Matrix

| Example | Framework | Performance | Complexity | Features | Best For |
|---------|-----------|-------------|------------|----------|----------|
| Express | Express.js | Medium | Low | Standard | Web apps |
| Standalone | Built-in | High | Low | Minimal | Dedicated servers |
| CLI | Command line | High | Very Low | Basic | Development |
| Koa | Koa.js | High | Medium | Modern | Async patterns |
| Fastify | Fastify | Very High | Medium | Advanced | High performance |
| Museum API | Direct | High | High | Complete | Learning/Reference |

## 🔧 Common Configuration

All examples use the same API definitions structure:

```
api-definitions/
├── museum-api.yaml           # OpenAPI 3.1.0 specification
└── museum-api.custom.yaml   # Customization config
```

### Environment Variables

Common environment variables across all examples:

```bash
# Required for museum API
MUSEUM_USER=your-username
MUSEUM_PASS=your-password

# Optional overrides
PORT=3000
OPENAPI_DEFINITIONS_DIR=./api-definitions
OPENAPI_CACHE_DIR=./api-definitions/.cache
OPENAPI_FORCE_REGEN=false
```

## 🔍 Debugging

### Enable Debug Mode
Most examples support debug mode:

```bash
NODE_ENV=development npm start
```

### Check Tool Generation
All examples will log tool generation:

```bash
npm start
# Look for: "Loaded X tools successfully!"
```

### Validate API Definitions
Use the museum-api test suite to validate your setup:

```bash
cd examples/museum-api
npm test
```

## 📚 Learning Path

Recommended order for exploring examples:

1. **Start with CLI Usage** - Understand basic functionality
2. **Try Museum API** - See complete feature set
3. **Explore Express Integration** - Learn middleware patterns
4. **Test with MCP Inspector** - Validate tool generation
5. **Integrate with Claude Desktop** - Experience real usage
6. **Try other frameworks** - Match your architecture needs

## 🤝 Contributing

When adding new examples:

1. Follow the established directory structure
2. Include comprehensive README.md
3. Add package.json with useful scripts
4. Provide .env.example template
5. Test with multiple scenarios
6. Update this main README

## 📞 Support

- 📖 [Main Documentation](../README.md)
- 🐛 [Issues](https://github.com/ephrin/openapi-mcp-server/issues)
- 💬 [Discussions](https://github.com/ephrin/openapi-mcp-server/discussions)

---

Each example is self-contained and demonstrates different aspects of the OpenAPI-to-MCP integration. Start with the **Museum API** example for the most comprehensive experience.