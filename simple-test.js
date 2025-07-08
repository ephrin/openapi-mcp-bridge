#!/usr/bin/env node

import axios from 'axios';

async function testMuseumHours() {
  console.log('[TEST] Testing museum hours endpoint via MCP Bridge...');
  
  try {
    const response = await axios.post('http://localhost:3003/mcp', {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'list-museum-hours',
        arguments: {
          page: 1,
          limit: 5
        }
      },
      id: 1
    });
    
    console.log('[TEST] SUCCESS! Museum hours retrieved:');
    const result = JSON.parse(response.data.result.content[0].text);
    console.log(JSON.stringify(result, null, 2));
    
    return result.data || result;
    
  } catch (error) {
    console.log('[TEST] FAILED:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    throw error;
  }
}

async function testAsAgent() {
  console.log('\n[AGENT] Acting as AI agent to get museum information...');
  
  try {
    // Step 1: Discover tools
    const toolsResponse = await axios.post('http://localhost:3003/mcp', {
      jsonrpc: '2.0',
      method: 'tools/list', 
      params: {},
      id: 1
    });
    
    const tools = toolsResponse.data.result.tools;
    console.log(`[AGENT] Discovered ${tools.length} tools`);
    
    // Step 2: Use museum hours tool
    const hoursResult = await testMuseumHours();
    
    // Step 3: Provide human-readable response
    console.log('\n[AGENT] Summary for user:');
    console.log('I found the museum hours for you:');
    hoursResult.slice(0, 3).forEach(day => {
      console.log(`  ${day.date}: ${day.timeOpen} - ${day.timeClose}`);
    });
    
    console.log('\n[SUCCESS] AI Agent successfully used MCP tools!');
    
  } catch (error) {
    console.error('[AGENT] Failed:', error.message);
  }
}

testAsAgent().catch(console.error);