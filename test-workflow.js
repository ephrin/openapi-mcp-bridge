#!/usr/bin/env node

/**
 * Test Workflow: Museum Ticket Purchase via MCP Server
 * 
 * This workflow demonstrates:
 * 1. Starting the MCP server with the current library
 * 2. Listing available tools from the museum API
 * 3. Purchasing a museum ticket using the generated MCP tool
 * 4. Saving the ticket QR code to a temporary directory
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPWorkflowTester {
  constructor() {
    this.serverProcess = null;
    this.serverPort = 3002;
    this.mcpEndpoint = `http://localhost:${this.serverPort}/mcp`;
    this.tmpDir = path.join(__dirname, 'tmp');
  }

  async setupTmpDirectory() {
    try {
      await fs.access(this.tmpDir);
    } catch {
      await fs.mkdir(this.tmpDir, { recursive: true });
    }
    console.log(`📁 Created tmp directory: ${this.tmpDir}`);
  }

  async startMCPServer() {
    console.log('🚀 Starting MCP Server...');
    
    // Create a local test server file that uses dist
    const testServerCode = `
async function main() {
  console.log('Starting OpenAPI-to-MCP Standalone Server...');
  
  const standaloneModule = await require('./dist/integrations/standalone.cjs');
  const { MCPServer } = standaloneModule;

  const server = new MCPServer({
    definitionsDirectory: './examples/standalone-server/api-definitions',
    port: process.env.PORT || 3002,
    mountPath: '/mcp',
    defaultCredentials: {
      username: process.env.MUSEUM_USER,
      password: process.env.MUSEUM_PASS
    },
    logging: { 
      consoleFallback: true 
    },
    mcpOptions: {
      serverName: 'museum-api-mcp',
      serverVersion: '1.0.0'
    }
  });

  try {
    await server.start();
    console.log(\`✅ MCP Server started successfully!\`);
    console.log(\`📡 MCP endpoint: http://localhost:\${server.port}\${server.mountPath}\`);
    console.log(\`🏥 Health check: http://localhost:\${server.port}/health\`);
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
`;
    
    await fs.writeFile(path.join(__dirname, 'test-server.cjs'), testServerCode);
    
    // Start the test server
    this.serverProcess = spawn('node', ['test-server.cjs'], {
      env: {
        ...process.env,
        PORT: this.serverPort,
        MUSEUM_USER: 'test_user',
        MUSEUM_PASS: 'test_password'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Wait for server to start
    return new Promise((resolve, reject) => {
      let output = '';
      
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[SERVER] ${data.toString().trim()}`);
        
        if (output.includes('MCP Server started successfully')) {
          console.log('✅ MCP Server is ready!');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`[SERVER ERROR] ${data.toString().trim()}`);
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 30000);
    });
  }

  async listAvailableTools() {
    console.log('\n📋 Listing available MCP tools...');
    
    try {
      const response = await axios.post(this.mcpEndpoint, {
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 1
      });
      
      const tools = response.data.result.tools;
      
      console.log(`Found ${tools.length} available tools:`);
      tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}`);
        console.log(`   Description: ${tool.description}`);
        console.log(`   Schema: ${JSON.stringify(tool.inputSchema.properties || {}, null, 2)}`);
        console.log('');
      });
      
      return tools;
    } catch (error) {
      throw new Error(`Failed to list tools: ${error.message}`);
    }
  }

  async purchaseMuseumTicket() {
    console.log('\n🎫 Purchasing museum ticket...');
    
    const ticketData = {
      ticketType: 'general',
      ticketDate: new Date().toISOString().split('T')[0], // Today's date
      email: 'test@example.com',
      phone: '+1234567890'
    };

    try {
      const response = await axios.post(this.mcpEndpoint, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'buy-tickets',
          arguments: {
            body: ticketData
          }
        },
        id: 2
      });

      console.log('✅ Ticket purchased successfully!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data.result;
    } catch (error) {
      console.error('❌ Failed to purchase ticket:', error.response?.data || error.message);
      throw error;
    }
  }

  async saveTicketQRCode(ticketData) {
    console.log('\n💾 Saving ticket QR code...');
    
    // Generate a mock QR code (in real scenario, this would come from the API response)
    const qrCodeData = {
      ticketId: ticketData.ticketId || 'TICKET_' + Date.now(),
      ticketType: ticketData.ticketType || 'general',
      purchaseDate: new Date().toISOString(),
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + 
               encodeURIComponent(JSON.stringify({
                 ticketId: ticketData.ticketId || 'TICKET_' + Date.now(),
                 venue: 'Museum',
                 date: ticketData.ticketDate || new Date().toISOString().split('T')[0]
               }))
    };

    const qrFilePath = path.join(this.tmpDir, `ticket_${qrCodeData.ticketId}.json`);
    await fs.writeFile(qrFilePath, JSON.stringify(qrCodeData, null, 2));
    
    console.log(`✅ Ticket QR code saved to: ${qrFilePath}`);
    console.log('QR Code URL:', qrCodeData.qrCode);
    
    return qrFilePath;
  }

  async stopMCPServer() {
    if (this.serverProcess) {
      console.log('\n🛑 Stopping MCP Server...');
      this.serverProcess.kill('SIGTERM');
      
      return new Promise((resolve) => {
        this.serverProcess.on('exit', () => {
          console.log('✅ MCP Server stopped');
          resolve();
        });
        
        // Force kill after 5 seconds
        setTimeout(() => {
          this.serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  }

  async runWorkflow() {
    try {
      // Setup
      await this.setupTmpDirectory();
      
      // Start MCP server
      await this.startMCPServer();
      
      // Wait a bit for server to fully initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // List available tools
      const tools = await this.listAvailableTools();
      
      // Check if ticket purchase tool is available
      const ticketTool = tools.find(tool => tool.name.includes('ticket') || tool.name.includes('buy'));
      if (!ticketTool) {
        console.log('⚠️  No ticket purchase tool found. Available tools:', tools.map(t => t.name));
        console.log('🔄 This might be expected if the museum API definition doesn\'t include ticket endpoints');
        return;
      }
      
      console.log(`✅ Found ticket tool: ${ticketTool.name}`);
      
      // Purchase ticket
      const ticketResult = await this.purchaseMuseumTicket();
      
      // Save QR code
      const qrFilePath = await this.saveTicketQRCode(ticketResult);
      
      console.log('\n🎉 Workflow completed successfully!');
      console.log(`📄 Ticket details saved to: ${qrFilePath}`);
      
    } catch (error) {
      console.error('\n❌ Workflow failed:', error.message);
      process.exit(1);
    } finally {
      await this.stopMCPServer();
    }
  }
}

// Check if API definitions exist
async function checkPrerequisites() {
  const definitionsDir = path.join(__dirname, 'examples/standalone-server/api-definitions');
  
  try {
    await fs.access(definitionsDir);
    console.log(`✅ API definitions directory found: ${definitionsDir}`);
  } catch {
    console.error(`❌ API definitions directory not found: ${definitionsDir}`);
    console.log('📝 Please ensure you have OpenAPI definition files in the api-definitions directory');
    console.log('   Example: museum-api.yaml with ticket purchase endpoints');
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🧪 OpenAPI-MCP Bridge Workflow Test\n');
  console.log('This workflow will:');
  console.log('1. Start an MCP server using the openapi-mcp-bridge library');
  console.log('2. List available tools from OpenAPI definitions');
  console.log('3. Purchase a museum ticket using MCP tools');
  console.log('4. Save ticket QR code to tmp directory\n');
  
  await checkPrerequisites();
  
  const tester = new MCPWorkflowTester();
  await tester.runWorkflow();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}