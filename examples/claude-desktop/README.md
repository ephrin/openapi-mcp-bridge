# Claude Desktop Integration Example

This example shows how to integrate the OpenAPI MCP Bridge with Claude Desktop for seamless AI-API interactions.

## Setup

### 1. Prepare Your API Definitions

```bash
mkdir claude-desktop-example
cd claude-desktop-example
```

Create `museum-api.yaml`:
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
                location:
                  type: string
                date:
                  type: string
                  format: date
                price:
                  type: number
              required: [name, location, date, price]
security:
  - BasicAuth: []
components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
```

Create `museum-api.custom.yaml`:
```yaml
toolAliases:
  "getMuseumHours": "get-museum-hours"
  "listSpecialEvents": "list-events"
  "createSpecialEvent": "create-event"

predefinedParameters:
  global:
    limit: 10
  endpoints:
    "listSpecialEvents":
      category: "museum-event"

authenticationOverrides:
  - endpoint: "*"
    credentials:
      username: "demo_user"
      password: "demo_password"
```

### 2. Configure Claude Desktop

**macOS**: Edit `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: Edit `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "museum-api": {
      "command": "npx",
      "args": [
        "openapi-mcp-bridge",
        "--definitions",
        "/absolute/path/to/your/claude-desktop-example"
      ],
      "env": {
        "MUSEUM_API_USERNAME": "demo_user",
        "MUSEUM_API_PASSWORD": "demo_password"
      }
    }
  }
}
```

**Important**: Use absolute paths in the configuration.

### 3. Restart Claude Desktop

Close and reopen Claude Desktop for the configuration to take effect.

## Usage Examples

### Basic API Queries

Ask Claude:
> "What are the museum hours for today?"

Claude will automatically call the `get-museum-hours` tool.

### Complex Operations

Ask Claude:
> "List all special events for next month, then create a new art exhibition event called 'Modern Sculptures' in the West Wing for December 15th with a ticket price of $25."

Claude will:
1. Call `list-events` with appropriate date parameters
2. Call `create-event` with the exhibition details

### Data Analysis

Ask Claude:
> "Get the museum hours for the next 7 days and analyze the schedule patterns."

Claude will make multiple API calls and analyze the results.

## Troubleshooting

### Configuration Issues

**Problem**: Claude Desktop doesn't show the MCP server
```bash
# Check if command works manually
npx openapi-mcp-bridge --definitions /path/to/definitions

# Check logs in Claude Desktop developer tools
# Help → Developer Tools → Console
```

**Solution**: Ensure absolute paths and proper JSON formatting.

### Authentication Issues

**Problem**: API calls fail with 401 Unauthorized
```json
{
  "mcpServers": {
    "museum-api": {
      "command": "npx",
      "args": ["openapi-mcp-bridge", "--definitions", "/path/to/definitions"],
      "env": {
        "MUSEUM_API_USERNAME": "your-username",
        "MUSEUM_API_PASSWORD": "your-password"
      }
    }
  }
}
```

**Solution**: Set correct environment variables for authentication.

### Tool Discovery Issues

**Problem**: Claude can't find or use the tools
```bash
# Test tool generation manually
mcp-inspector npx openapi-mcp-bridge --definitions /path/to/definitions
```

**Solution**: Check OpenAPI file validity and tool generation.

### Performance Issues

**Problem**: Slow responses or timeouts
```json
{
  "mcpServers": {
    "museum-api": {
      "command": "npx",
      "args": [
        "openapi-mcp-bridge",
        "--definitions",
        "/path/to/definitions",
        "--no-cache"
      ],
      "timeout": 30000
    }
  }
}
```

**Solution**: Adjust timeout and caching settings.

## Advanced Configuration

### Multiple API Sources

```json
{
  "mcpServers": {
    "museum-api": {
      "command": "npx",
      "args": ["openapi-mcp-bridge", "--definitions", "/path/to/museum-api"]
    },
    "weather-api": {
      "command": "npx",
      "args": ["openapi-mcp-bridge", "--definitions", "/path/to/weather-api"]
    }
  }
}
```

### Custom Environment Variables

```json
{
  "mcpServers": {
    "museum-api": {
      "command": "npx",
      "args": ["openapi-mcp-bridge", "--definitions", "/path/to/definitions"],
      "env": {
        "OPENAPI_FORCE_REGEN": "true",
        "DEBUG": "true",
        "MUSEUM_API_USERNAME": "user",
        "MUSEUM_API_PASSWORD": "pass"
      }
    }
  }
}
```

### Using Local Package

If you have the package installed locally:

```json
{
  "mcpServers": {
    "museum-api": {
      "command": "node",
      "args": [
        "/path/to/node_modules/.bin/openapi-mcp-bridge",
        "--definitions",
        "/path/to/definitions"
      ]
    }
  }
}
```

## Expected Behavior

When properly configured, you should see:

1. **Tool Discovery**: Claude will automatically discover available API tools
2. **Natural Language**: Ask questions in natural language
3. **Automatic Calls**: Claude will make appropriate API calls
4. **Response Integration**: API responses will be integrated into Claude's answers
5. **Error Handling**: Failed API calls will be handled gracefully

## File Structure

```
claude-desktop-example/
├── museum-api.yaml           # OpenAPI specification
├── museum-api.custom.yaml    # Optional customization
├── .cache/                   # Auto-generated cache
└── README.md                 # This file
```

## Testing

Before configuring Claude Desktop, test manually:

```bash
# Test tool generation
mcp-inspector npx openapi-mcp-bridge --definitions .

# Test specific tools
# In MCP Inspector, try calling get-museum-hours with date parameter
```

## Security Considerations

- Use environment variables for sensitive credentials
- Avoid hardcoding API keys in configuration files
- Consider using API key rotation for production APIs
- Monitor API usage when connected to AI models

## Next Steps

1. **Extend API Coverage**: Add more OpenAPI definitions
2. **Custom Tools**: Create custom tool aliases and parameters
3. **Monitoring**: Set up logging and monitoring for API usage
4. **Production Setup**: Configure for production API endpoints

For more examples and advanced usage, see the [main documentation](../../README.md).