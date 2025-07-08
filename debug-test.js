#!/usr/bin/env node

import axios from 'axios';

async function testDirectAPI() {
  console.log('[DEBUG] Testing direct API call...');
  
  try {
    const response = await axios.post(
      'https://redocly.com/_mock/demo/openapi/museum-api/tickets',
      {
        ticketType: 'general',
        ticketDate: '2025-07-08', 
        email: 'debug-test@example.com'
      },
      {
        auth: {
          username: 'demo_user',
          password: 'demo_password'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('[DEBUG] Direct API SUCCESS:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('[DEBUG] Direct API FAILED:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

async function testMCPBridge() {
  console.log('\n[DEBUG] Testing MCP Bridge...');
  
  try {
    const response = await axios.post('http://localhost:3003/mcp', {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'buy-tickets',
        arguments: {
          body: {
            ticketType: 'general',
            ticketDate: '2025-07-08',
            email: 'debug-test@example.com'
          }
        }
      },
      id: 1
    });
    
    console.log('[DEBUG] MCP Bridge result:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('[DEBUG] MCP Bridge FAILED:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

async function main() {
  await testDirectAPI();
  await testMCPBridge();
}

main().catch(console.error);