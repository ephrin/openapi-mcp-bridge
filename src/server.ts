#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as path from 'path';
import { MCPProxyService } from './services/mcp-proxy-service.js';
import { LibraryConfig } from './types/config.js';
import { MCPProxyError } from './types/errors.js';

// Configure the service
const config: LibraryConfig = {
  definitionsDirectory: process.env.OPENAPI_DEFINITIONS_DIR || './definitions',
  cacheDirectory: process.env.OPENAPI_CACHE_DIR || './definitions/.cache',
  forceRegeneration: process.env.OPENAPI_FORCE_REGEN === 'true',
  defaultCredentials: {
    // Extract credentials from environment
    username: process.env.OPENAPI_USERNAME,
    password: process.env.OPENAPI_PASSWORD,
    token: process.env.OPENAPI_TOKEN,
    key: process.env.OPENAPI_API_KEY,
  },
  mcpOptions: {
    serverName: "openapi-mcp",
    serverVersion: "0.1.0"
  },
  logging: {
    consoleFallback: true
  }
};

// Remove undefined values from credentials
Object.keys(config.defaultCredentials!).forEach(key => {
  if (config.defaultCredentials![key] === undefined) {
    delete config.defaultCredentials![key];
  }
});

// Initialize MCP server
const server = new Server(
  {
    name: config.mcpOptions?.serverName || "openapi-mcp",
    version: config.mcpOptions?.serverVersion || "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize the proxy service
const proxyService = new MCPProxyService(config);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    const tools = await proxyService.getAvailableTools();
    return { tools };
  } catch (error: any) {
    console.error("Failed to list tools:", error.message);
    return { tools: [] };
  }
});

// Handle tool execution request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await proxyService.executeTool(name, args || {});
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    let errorMessage: string;
    let errorDetails: any = undefined;
    
    if (error instanceof MCPProxyError) {
      errorMessage = error.message;
      errorDetails = error.details;
    } else {
      errorMessage = `Unexpected error: ${error.message}`;
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            message: errorMessage,
            details: errorDetails
          }, null, 2),
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log startup information to stderr (not captured by MCP)
  console.error(`OpenAPI MCP server running on stdio`);
  console.error(`Definitions directory: ${config.definitionsDirectory}`);
  console.error(`Cache directory: ${config.cacheDirectory || 'disabled'}`);
  console.error(`Force regeneration: ${config.forceRegeneration ? 'enabled' : 'disabled'}`);
  
  // Load definitions at startup to catch errors early
  try {
    const tools = await proxyService.getAvailableTools();
    console.error(`Loaded ${tools.length} tools from definitions`);
  } catch (error: any) {
    console.error(`Warning: Failed to load initial definitions: ${error.message}`);
  }
}

export default main;

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}