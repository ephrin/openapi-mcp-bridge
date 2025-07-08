#!/usr/bin/env node

// Import the package (async since it's ESM)
let MCPProxyService;

async function loadPackage() {
  const pkg = await require('openapi-mcp-bridge');
  MCPProxyService = pkg.MCPProxyService;
}

// Configure the service exactly like the main implementation
const config = {
  definitionsDirectory: process.env.OPENAPI_DEFINITIONS_DIR || './api-definitions',
  cacheDirectory: process.env.OPENAPI_CACHE_DIR || './api-definitions/.cache',
  forceRegeneration: process.env.OPENAPI_FORCE_REGEN === 'true',
  defaultCredentials: {
    // Extract credentials from environment
    username: process.env.OPENAPI_USERNAME || process.env.MUSEUM_USER,
    password: process.env.OPENAPI_PASSWORD || process.env.MUSEUM_PASS,
    token: process.env.OPENAPI_TOKEN,
    key: process.env.OPENAPI_API_KEY,
  },
  mcpOptions: {
    serverName: "museum-api-mcp",
    serverVersion: "1.0.0"
  },
  logging: {
    consoleFallback: true
  }
};

// Remove undefined values from credentials
Object.keys(config.defaultCredentials).forEach(key => {
  if (config.defaultCredentials[key] === undefined) {
    delete config.defaultCredentials[key];
  }
});

async function main() {
  console.log('🏛️  Museum API MCP Server Example');
  console.log('=====================================');
  
  // Load the package first
  await loadPackage();
  
  // Initialize the proxy service directly
  const proxyService = new MCPProxyService(config);
  
  try {
    console.log(`📁 Loading definitions from: ${config.definitionsDirectory}`);
    console.log(`💾 Cache directory: ${config.cacheDirectory || 'disabled'}`);
    console.log(`🔄 Force regeneration: ${config.forceRegeneration ? 'enabled' : 'disabled'}`);
    
    // Load available tools
    const tools = await proxyService.getAvailableTools();
    console.log(`✅ Loaded ${tools.length} tools successfully!`);
    
    console.log('\n🔧 Available Tools:');
    console.log('==================');
    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   📝 ${tool.description}`);
      console.log(`   📋 Required: ${tool.inputSchema.required?.join(', ') || 'none'}`);
      console.log('');
    });
    
    // Example tool execution
    console.log('🧪 Testing Tool Execution:');
    console.log('==========================');
    
    try {
      // Test list-museum-hours (should have query params)
      console.log('Testing list-museum-hours...');
      const hoursResult = await proxyService.executeTool('list-museum-hours', {
        startDate: '2023-12-01',
        page: 1,
        limit: 5
      });
      console.log('✅ Hours API call result:', JSON.stringify(hoursResult, null, 2));
    } catch (error) {
      console.log('⚠️  Hours API call failed (expected if API is not available):', error.message);
    }
    
    try {
      // Test get-event-details (should have path params)
      console.log('\nTesting get-event-details...');
      const eventResult = await proxyService.executeTool('get-event-details', {
        eventId: '123e4567-e89b-12d3-a456-426614174000'
      });
      console.log('✅ Event API call result:', JSON.stringify(eventResult, null, 2));
    } catch (error) {
      console.log('⚠️  Event API call failed (expected if API is not available):', error.message);
    }
    
    console.log('\n🎯 MCP Server Ready!');
    console.log('====================');
    console.log('This example demonstrates the complete functionality of the OpenAPI-to-MCP server.');
    console.log('In a real scenario, you would:');
    console.log('1. Run this as an MCP server using stdio transport');
    console.log('2. Connect it to Claude Desktop or other MCP clients');
    console.log('3. Use the generated tools to interact with the museum API');
    
  } catch (error) {
    console.error('❌ Failed to initialize MCP service:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };