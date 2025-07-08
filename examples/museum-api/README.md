# Museum API Complete Example

This is the complete, reference implementation demonstrating all features of the OpenAPI-to-MCP server using a realistic museum API.

## Overview

This example showcases:
- ✅ Complete OpenAPI definition with multiple endpoints
- ✅ Customization configuration with aliases, parameters, and authentication
- ✅ Tool generation and parameter flattening
- ✅ Authentication handling (HTTP Basic)
- ✅ Caching with force regeneration support
- ✅ Comprehensive testing suite
- ✅ Multiple usage patterns (direct, CLI, MCP client)

## API Endpoints

The museum API includes:

1. **GET /museum-hours** → `list-museum-hours`
   - Query parameters: startDate, page, limit
   - Lists museum operating hours

2. **GET /special-events** → `list-events`
   - Query parameters: startDate, endDate, page, limit
   - Lists special events

3. **POST /special-events** → `create-event`
   - Request body: event details
   - Creates new special events

4. **GET /special-events/{eventId}** → `get-event-details`
   - Path parameter: eventId
   - Gets specific event details

5. **PATCH /special-events/{eventId}** → `update-event`
   - Path parameter: eventId + request body
   - Updates existing events

6. **DELETE /special-events/{eventId}** → `delete-event`
   - Path parameter: eventId
   - Deletes events

7. **POST /tickets** → `buy-tickets`
   - Request body: ticket purchase details
   - Purchases museum tickets

8. **GET /tickets/{ticketId}/qr** → `get-ticket-qr`
   - Path parameter: ticketId
   - Gets QR code for tickets

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

3. Run the example:
```bash
npm start
```

## Testing

Run the comprehensive test suite:
```bash
npm test
```

This will validate:
- ✅ Tool loading and generation
- ✅ Parameter validation
- ✅ Schema structure
- ✅ Authentication configuration
- ✅ Cache functionality
- ✅ HTTP request building

## Usage Patterns

### 1. Direct Service Usage
```bash
npm start
```
Demonstrates direct use of MCPProxyService.

### 2. CLI Usage
```bash
npm run cli
```
Uses the command-line interface.

### 3. MCP Inspector
```bash
npm run inspect
```
Opens the MCP Inspector for interactive testing.

## Configuration Files

### `api-definitions/museum-api.yaml`
Complete OpenAPI 3.1.0 specification with:
- Multiple HTTP methods (GET, POST, PATCH, DELETE)
- Path parameters (`{eventId}`, `{ticketId}`)
- Query parameters (`startDate`, `page`, `limit`)
- Request bodies (JSON schemas)
- Security schemes (HTTP Basic)

### `api-definitions/museum-api.custom.yaml`
Customization configuration with:
- **Tool Aliases**: Friendly names for generated tools
- **Predefined Parameters**: Default values for common parameters
- **Authentication Overrides**: Credentials for all endpoints

## Generated Tools

The system automatically converts the OpenAPI definition into 8 MCP tools:

```json
[
  {
    "name": "list-museum-hours",
    "description": "Get museum hours",
    "inputSchema": {
      "properties": {
        "startDate": { "type": "string", "format": "date" },
        "page": { "type": "integer", "default": 1 },
        "limit": { "type": "integer", "default": 10 }
      }
    }
  },
  {
    "name": "get-event-details", 
    "description": "Get special event",
    "inputSchema": {
      "properties": {
        "eventId": { "type": "string", "format": "uuid" }
      },
      "required": ["eventId"]
    }
  }
  // ... 6 more tools
]
```

## Advanced Features

### Parameter Flattening
Complex OpenAPI operations with path parameters, query parameters, and request bodies are flattened into a single MCP tool input schema.

**Example**: `PATCH /special-events/{eventId}`
```yaml
# OpenAPI Definition
parameters:
  - name: eventId
    in: path
    required: true
requestBody:
  content:
    application/json:
      schema:
        properties:
          name: { type: string }
          location: { type: string }
```

**Generated MCP Tool**:
```json
{
  "inputSchema": {
    "properties": {
      "eventId": { "type": "string" },
      "name": { "type": "string" },
      "location": { "type": "string" }
    },
    "required": ["eventId"]
  }
}
```

### Smart Authentication
Automatically applies HTTP Basic authentication to all endpoints using environment variables.

### Intelligent Caching
Uses content-based hashing to detect changes in OpenAPI definitions and customization configs, with support for force regeneration during development.

## Integration Examples

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "museum-api": {
      "command": "node",
      "args": ["path/to/museum-api/server.js"],
      "env": {
        "MUSEUM_USER": "your-username",
        "MUSEUM_PASS": "your-password"
      }
    }
  }
}
```

### Cursor IDE Integration
```json
{
  "mcpServers": {
    "museum-api": {
      "command": "npx",
      "args": ["openapi-mcp-bridge", "--definitions", "./api-definitions"]
    }
  }
}
```

## Expected LLM Interactions

After connecting to an MCP client, you can ask natural language questions like:

> "What are the museum hours for next week?"

The LLM will use `list-museum-hours` with appropriate date parameters.

> "Create a new art exhibition event for December 15th called 'Modern Sculptures' in the West Wing, then buy 2 tickets for it."

The LLM will:
1. Use `create-event` to create the exhibition
2. Use `buy-tickets` to purchase tickets

## File Structure

```
museum-api/
├── package.json              # Dependencies and scripts
├── server.js                 # Main example server
├── test.js                   # Comprehensive test suite
├── README.md                 # This file
└── api-definitions/
    ├── museum-api.yaml       # OpenAPI 3.1.0 specification
    ├── museum-api.custom.yaml # Customization config
    └── .cache/               # Auto-generated cache (created on first run)
        └── *.enriched.json   # Cached enriched definitions
```

## Troubleshooting

1. **No tools loaded**: Check that `api-definitions/` contains valid YAML files
2. **Authentication errors**: Verify `MUSEUM_USER` and `MUSEUM_PASS` environment variables
3. **Network errors**: Expected when testing against the fake API - indicates HTTP requests are built correctly
4. **Cache issues**: Set `OPENAPI_FORCE_REGEN=true` to force regeneration

## Development

This example serves as the reference implementation and test bed for the OpenAPI-to-MCP server. All features are demonstrated and tested here.