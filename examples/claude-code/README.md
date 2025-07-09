# Claude Code Integration Guide

This guide shows how to integrate the OpenAPI MCP Bridge with Claude Code for seamless AI-driven API interactions.

## What is Claude Code?

Claude Code is Anthropic's coding assistant that can work with external tools through the Model Context Protocol (MCP). Unlike Claude Desktop which requires configuration files, Claude Code can dynamically add MCP servers using the `claude mcp add` command.

## Quick Setup

### 1. Prepare Your API Definitions

Create your OpenAPI definition:

```bash
mkdir my-api-project
cd my-api-project
mkdir api-definitions
```

Create `api-definitions/museum-api.yaml`:
```yaml
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
          description: Specific date to get hours for
  /special-events:
    get:
      summary: List special events
      operationId: listSpecialEvents
      parameters:
        - name: startDate
          in: query
          schema:
            type: string
            format: date
        - name: endDate
          in: query
          schema:
            type: string
            format: date
    post:
      summary: Create special event
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
                  description: Event name
                  example: "Contemporary Art Exhibition"
                location:
                  type: string
                  description: Event location
                  example: "West Wing Gallery"
                date:
                  type: string
                  format: date
                  description: Event date
                  example: "2024-12-15"
                price:
                  type: number
                  description: Ticket price
                  example: 25.00
              required: [name, location, date, price]
security:
  - BasicAuth: []
components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
```

### 2. Add MCP Server to Claude Code

In Claude Code, use the `claude mcp add` command:

```bash
claude mcp add museum-api npx openapi-mcp-bridge --definitions ./api-definitions
```

**Note**: If you encounter argument parsing issues, use:
```bash
claude mcp add museum-api npx -- openapi-mcp-bridge --definitions ./api-definitions
```

### 3. Verify Integration

Check that the MCP server was added:
```bash
claude mcp list
```

You should see:
```
museum-api: npx openapi-mcp-bridge --definitions ./api-definitions
```

### 4. Restart Session (If Needed)

If tools don't appear immediately, restart your Claude Code session:
- Close the current session
- Start a new session
- Tools should now be available

## Usage Examples

### Basic API Queries

Ask Claude Code:
> "What are the museum hours for today?"

Claude will automatically use the `getMuseumHours` tool.

### Complex Operations

Ask Claude Code:
> "List all special events for December 2024, then create a new art exhibition called 'Digital Renaissance' in the East Wing for December 20th with a $30 ticket price."

Claude will:
1. Call `listSpecialEvents` with date parameters
2. Call `createSpecialEvent` with the exhibition details

### Tool Discovery

Ask Claude Code:
> "What museum API tools are available?"

Claude will list available tools:
- `getMuseumHours` - Get museum hours
- `listSpecialEvents` - List special events  
- `createSpecialEvent` - Create special event

## Tool Naming Patterns

The library automatically generates predictable tool names:

| OpenAPI Operation | Generated Tool Name | Description |
|-------------------|--------------------|-----------| 
| `GET /museum-hours` | `getMuseumHours` | Uses operationId if available |
| `GET /special-events` | `listSpecialEvents` | Uses operationId if available |
| `POST /special-events` | `createSpecialEvent` | Uses operationId if available |
| `GET /events/{id}` | `get-events-by-id` | Auto-generated from method + path |
| `DELETE /events/{id}` | `delete-events-by-id` | Auto-generated from method + path |

**Pattern**: `{operationId}` or `{method}-{path-with-params}`

## Troubleshooting

### Common Issues

#### 1. Tools Not Available After Adding MCP Server

**Problem**: After `claude mcp add`, tools don't appear in current session

**Solution**: Restart Claude Code session
```bash
# In Claude Code
exit
# Start new session
claude code
```

#### 2. Argument Parsing Errors

**Problem**: `error: unknown option '--definitions'`

**Solution**: Use double-dash syntax:
```bash
claude mcp add museum-api npx -- openapi-mcp-bridge --definitions ./api-definitions
```

#### 3. Tools Show Empty Body Schemas

**Problem**: Request body parameters not clearly defined

**Solution**: Add detailed examples in OpenAPI spec:
```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        properties:
          name:
            type: string
            description: Event name
            example: "Art Exhibition"
        required: [name]
```

#### 4. MCP Server Not Starting

**Problem**: Server fails to start or connect

**Debug Steps**:
```bash
# Test CLI directly
npx openapi-mcp-bridge --definitions ./api-definitions --debug

# Check if package is installed
npm list -g openapi-mcp-bridge

# Force fresh installation
npm install -g openapi-mcp-bridge@latest
```

#### 5. API Authentication Issues

**Problem**: API calls fail with 401 Unauthorized

**Solution**: Add authentication configuration:

Create `api-definitions/museum-api.custom.yaml`:
```yaml
authenticationOverrides:
  - endpoint: "*"
    credentials:
      username: "demo_user"
      password: "demo_password"
```

### Debug Mode

Enable debug logging to see detailed information:

```bash
claude mcp add museum-api npx openapi-mcp-bridge --definitions ./api-definitions --debug
```

This will show:
- API definitions being loaded
- Tools being generated
- Cache operations
- Request/response details

### Transport Mode Decision

Claude Code uses **stdio transport** by default, which is optimal for:
- ✅ Local development
- ✅ Single-user scenarios
- ✅ Simple integration
- ✅ No network configuration needed
- ✅ Automatic process management

**When to use HTTP transport instead**:
- Multi-user scenarios
- Remote API access
- When you need HTTP middleware
- Integration with existing web applications

## Advanced Configuration

### Custom Tool Names

Create `api-definitions/museum-api.custom.yaml`:
```yaml
toolAliases:
  "getMuseumHours": "get-hours"
  "listSpecialEvents": "list-events"
  "createSpecialEvent": "create-event"
```

### Predefined Parameters

Set default parameter values:
```yaml
predefinedParameters:
  global:
    limit: 10
  endpoints:
    "listSpecialEvents":
      category: "museum-event"
```

### Environment Variables

Set authentication via environment:
```bash
export MUSEUM_API_USERNAME="your-username"
export MUSEUM_API_PASSWORD="your-password"

claude mcp add museum-api npx openapi-mcp-bridge --definitions ./api-definitions
```

## Best Practices

### 1. API Definition Structure
```
project/
├── api-definitions/
│   ├── museum-api.yaml          # Main OpenAPI spec
│   ├── museum-api.custom.yaml   # Customizations
│   └── .cache/                  # Auto-generated cache
├── src/
│   └── your-app-code.js
└── package.json
```

### 2. Tool Documentation
Include rich descriptions and examples in your OpenAPI spec:
```yaml
paths:
  /museum-hours:
    get:
      summary: Get museum hours
      description: |
        Retrieve operating hours for the museum on a specific date.
        Returns opening/closing times and whether the museum is open.
      parameters:
        - name: date
          description: ISO date string (YYYY-MM-DD)
          example: "2024-12-15"
```

### 3. Error Handling
Your API should return helpful error messages:
```yaml
responses:
  '400':
    description: Bad Request
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Invalid date format"
```

### 4. Testing Integration
Before adding to Claude Code, test locally:
```bash
# Test CLI
npx openapi-mcp-bridge --definitions ./api-definitions --debug

# Test with MCP Inspector
npm install -g @modelcontextprotocol/inspector
mcp-inspector npx openapi-mcp-bridge --definitions ./api-definitions
```

## Session Management

### Tool Availability
Tools become available after:
1. Successfully adding MCP server
2. Restarting Claude Code session (if needed)
3. API definitions are parsed without errors

### Hot Reloading
Currently, API definition changes require:
1. Removing the MCP server: `claude mcp remove museum-api`
2. Re-adding: `claude mcp add museum-api npx openapi-mcp-bridge --definitions ./api-definitions`
3. Restarting session

### Cache Management
Force cache regeneration:
```bash
claude mcp add museum-api npx openapi-mcp-bridge --definitions ./api-definitions --no-cache
```

## Integration Examples

### E-commerce API
```yaml
paths:
  /products:
    get:
      operationId: listProducts
      parameters:
        - name: category
          in: query
          schema:
            type: string
            enum: [electronics, clothing, books]
    post:
      operationId: createProduct
      requestBody:
        content:
          application/json:
            schema:
              properties:
                name: { type: string }
                price: { type: number }
                category: { type: string }
```

### Weather API
```yaml
paths:
  /weather:
    get:
      operationId: getCurrentWeather
      parameters:
        - name: location
          in: query
          required: true
          schema:
            type: string
            description: City name or coordinates
            example: "New York"
```

## Next Steps

1. **Test Integration**: Verify tools work as expected
2. **Expand API Coverage**: Add more endpoints to your OpenAPI spec
3. **Customize Tools**: Use custom.yaml for aliases and parameters
4. **Monitor Usage**: Check API calls and responses
5. **Iterate**: Improve based on Claude Code's usage patterns

For more examples and advanced usage, see the [main documentation](../../README.md).

## Feedback and Contributions

If you encounter issues or have improvements:
1. Check the [troubleshooting section](#troubleshooting)
2. Report issues at [GitHub Issues](https://github.com/ephrin/openapi-mcp-bridge/issues)
3. Contribute improvements via pull requests

The Claude Code integration is designed to be seamless and efficient, making your APIs immediately available to AI-powered development workflows.