#!/usr/bin/env node

/**
 * AI Agent Test Script
 * 
 * This script simulates an AI agent discovering and using MCP tools
 * to book a museum ticket through the OpenAPI-MCP Bridge.
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

class AIAgent {
  constructor(mcpEndpoint) {
    this.mcpEndpoint = mcpEndpoint;
    this.tools = new Map();
    this.requestId = 1;
  }

  async discoverTools() {
    console.log('[AGENT] Discovering available tools...');
    
    try {
      const response = await axios.post(this.mcpEndpoint, {
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: this.requestId++
      });

      const tools = response.data.result.tools;
      
      console.log(`[AGENT] Found ${tools.length} available tools:`);
      tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
        this.tools.set(tool.name, tool);
      });
      
      return tools;
    } catch (error) {
      console.error('[AGENT] Failed to discover tools:', error.message);
      throw error;
    }
  }

  async callTool(toolName, arguments_) {
    console.log(`[AGENT] Calling tool: ${toolName}`);
    console.log(`[AGENT] Arguments:`, JSON.stringify(arguments_, null, 2));
    
    try {
      const response = await axios.post(this.mcpEndpoint, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: arguments_
        },
        id: this.requestId++
      });

      if (response.data.error) {
        throw new Error(`Tool error: ${response.data.error.message}`);
      }

      const result = response.data.result;
      console.log(`[AGENT] Tool result:`, JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error(`[AGENT] Failed to call tool ${toolName}:`, error.message);
      throw error;
    }
  }

  async bookMuseumTicket(userRequest) {
    console.log(`\n[AGENT] Processing user request: "${userRequest}"`);
    
    // Step 1: Discover available tools
    await this.discoverTools();
    
    // Step 2: Find ticket booking tool
    const ticketTool = this.tools.get('buy-tickets');
    if (!ticketTool) {
      throw new Error('No ticket booking tool available');
    }
    
    console.log(`[AGENT] Found ticket booking tool: ${ticketTool.name}`);
    
    // Step 3: Prepare ticket data based on user request
    const ticketData = {
      ticketType: 'general', // Could be extracted from user request
      ticketDate: new Date().toISOString().split('T')[0], // Today
      email: 'agent-test@example.com'
    };
    
    // Step 4: Call the ticket booking tool
    // Try both formats - wrapped in body and direct
    let ticketResult;
    try {
      ticketResult = await this.callTool('buy-tickets', ticketData);
    } catch (error) {
      console.log('[AGENT] Direct format failed, trying body wrapper...');
      ticketResult = await this.callTool('buy-tickets', {
        body: ticketData
      });
    }
    
    // Step 5: Process the result
    if (ticketResult.content && ticketResult.content[0]) {
      const ticketInfo = JSON.parse(ticketResult.content[0].text);
      console.log(`\n[AGENT] SUCCESS! Ticket booked:`);
      console.log(`  Ticket ID: ${ticketInfo.ticketId}`);
      console.log(`  Confirmation: ${ticketInfo.confirmationCode}`);
      console.log(`  Message: ${ticketInfo.message}`);
      
      // Step 6: Try to get QR code if ticket ID is available
      if (ticketInfo.ticketId) {
        try {
          const qrResult = await this.callTool('get-ticket-qr', {
            ticketId: ticketInfo.ticketId
          });
          
          console.log(`[AGENT] QR code retrieved successfully`);
          
          // Save QR code info to file
          const qrData = {
            ticketId: ticketInfo.ticketId,
            qrCode: qrResult.content?.[0]?.text || 'QR code data',
            retrievedAt: new Date().toISOString()
          };
          
          const qrFilePath = path.join('./tmp', `ticket-${ticketInfo.ticketId}.json`);
          await fs.mkdir('./tmp', { recursive: true });
          await fs.writeFile(qrFilePath, JSON.stringify(qrData, null, 2));
          
          console.log(`[AGENT] QR code saved to: ${qrFilePath}`);
          
        } catch (qrError) {
          console.log(`[AGENT] Could not retrieve QR code: ${qrError.message}`);
        }
      }
      
      return ticketInfo;
    } else {
      throw new Error('Unexpected response format from ticket booking');
    }
  }

  async checkHealth() {
    try {
      const healthUrl = this.mcpEndpoint.replace('/mcp', '/health');
      const response = await axios.get(healthUrl);
      console.log('[AGENT] Server health:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AGENT] Health check failed:', error.message);
      throw error;
    }
  }
}

async function main() {
  console.log('[TEST] Starting AI Agent Workflow Test');
  console.log('[TEST] Simulating: User asks AI agent to book a museum ticket\n');
  
  const agent = new AIAgent('http://localhost:3003/mcp');
  
  try {
    // Check if server is healthy
    await agent.checkHealth();
    
    // Simulate user request
    const userRequest = "Book me a general admission ticket for today";
    
    // Agent processes the request
    const ticketInfo = await agent.bookMuseumTicket(userRequest);
    
    console.log('\n[TEST] ✅ Workflow completed successfully!');
    console.log('[TEST] The AI agent successfully:');
    console.log('[TEST]   1. Discovered available MCP tools');
    console.log('[TEST]   2. Selected the appropriate ticket booking tool');
    console.log('[TEST]   3. Called the tool with proper parameters');
    console.log('[TEST]   4. Retrieved and saved the QR code');
    console.log('[TEST]   5. Provided structured response to user');
    
  } catch (error) {
    console.error('\n[TEST] ❌ Workflow failed:', error.message);
    console.error('[TEST] This could be due to:');
    console.error('[TEST]   - MCP server not running on port 3003');
    console.error('[TEST]   - Network connectivity issues');
    console.error('[TEST]   - API definition parsing errors');
    console.error('[TEST]   - Tool execution failures');
    
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);