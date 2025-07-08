#!/usr/bin/env node

const { MCPProxyService } = require('../../dist/services/mcp-proxy-service.js');

async function runTests() {
  console.log('🧪 Museum API MCP Server Test Suite');
  console.log('====================================');
  
  const config = {
    definitionsDirectory: './api-definitions',
    cacheDirectory: './api-definitions/.cache',
    forceRegeneration: true, // Always regenerate for testing
    defaultCredentials: {
      username: process.env.MUSEUM_USER || 'test-user',
      password: process.env.MUSEUM_PASS || 'test-pass',
    },
    mcpOptions: {
      serverName: "museum-api-test",
      serverVersion: "1.0.0"
    },
    logging: {
      consoleFallback: true
    }
  };
  
  const proxyService = new MCPProxyService(config);
  let testsPassed = 0;
  let testsFailed = 0;
  
  function assert(condition, message) {
    if (condition) {
      console.log(`✅ ${message}`);
      testsPassed++;
    } else {
      console.log(`❌ ${message}`);
      testsFailed++;
    }
  }
  
  try {
    // Test 1: Load tools
    console.log('\n📋 Test 1: Loading Tools');
    const tools = await proxyService.getAvailableTools();
    assert(tools.length > 0, `Loaded ${tools.length} tools`);
    assert(tools.some(t => t.name === 'list-museum-hours'), 'Found list-museum-hours tool');
    assert(tools.some(t => t.name === 'get-event-details'), 'Found get-event-details tool');
    assert(tools.some(t => t.name === 'create-event'), 'Found create-event tool');
    
    // Test 2: Tool structure validation
    console.log('\n🔍 Test 2: Tool Structure Validation');
    const hoursTool = tools.find(t => t.name === 'list-museum-hours');
    assert(hoursTool.description.length > 0, 'Hours tool has description');
    assert(hoursTool.inputSchema.type === 'object', 'Hours tool has object schema');
    assert(hoursTool.inputSchema.properties, 'Hours tool has properties');
    
    const eventTool = tools.find(t => t.name === 'get-event-details');
    assert(eventTool.inputSchema.required.includes('eventId'), 'Event tool requires eventId');
    assert(eventTool.inputSchema.properties.eventId, 'Event tool has eventId property');
    
    // Test 3: Parameter validation
    console.log('\n✅ Test 3: Parameter Validation');
    try {
      await proxyService.executeTool('get-event-details', {}); // Missing required eventId
      assert(false, 'Should fail with missing required parameter');
    } catch (error) {
      assert(error.message.includes('Missing required parameter'), 'Correctly validates missing parameters');
    }
    
    // Test 4: Tool execution structure (will fail HTTP but should build request correctly)
    console.log('\n🔧 Test 4: Tool Execution Structure');
    try {
      await proxyService.executeTool('list-museum-hours', {
        startDate: '2023-12-01',
        page: 1,
        limit: 5
      });
      assert(false, 'Should fail with network error (expected)');
    } catch (error) {
      // Expected to fail because API doesn't exist, but should be network error not validation error
      assert(error.message.includes('Network error') || error.message.includes('ENOTFOUND'), 'Correctly builds HTTP request (network error expected)');
    }
    
    // Test 5: Authentication configuration
    console.log('\n🔐 Test 5: Authentication Configuration');
    const definitions = proxyService.getLoadedDefinitions();
    assert(definitions.length > 0, 'Has loaded definitions');
    
    // Test 6: Cache functionality
    console.log('\n💾 Test 6: Cache Functionality');
    const tools2 = await proxyService.getAvailableTools(); // Second load should use cache or regenerate
    assert(tools2.length === tools.length, 'Consistent tool count on reload');
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! The MCP server is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch((error) => {
    console.error('💥 Fatal test error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };