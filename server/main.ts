#!/usr/bin/env node

/**
 * Standalone MCP Bridge Server
 * 
 * This server exposes OpenAPI definitions from the definitions/ directory
 * as MCP tools accessible at the /mcp endpoint.
 * 
 * Usage:
 *   npm run server
 *   tsx server/main.ts
 * 
 * Environment Variables:
 *   PORT - Server port (default: 3000)
 *   MCP_MOUNT_PATH - MCP endpoint path (default: /mcp)
 *   MUSEUM_API_USERNAME - API username for authentication
 *   MUSEUM_API_PASSWORD - API password for authentication
 */

import { MCPServer } from '../src/integrations/standalone.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('[START] Starting OpenAPI-MCP Bridge Server...');
  
  // Configuration
  const config = {
    definitionsDirectory: path.join(__dirname, '../definitions'),
    port: parseInt(process.env.PORT || '3000'),
    mountPath: process.env.MCP_MOUNT_PATH || '/mcp',
    defaultCredentials: {
      username: process.env.MUSEUM_API_USERNAME || 'demo_user',
      password: process.env.MUSEUM_API_PASSWORD || 'demo_password'
    },
    logging: { 
      consoleFallback: true 
    },
    mcpOptions: {
      serverName: 'openapi-mcp-bridge-server',
      serverVersion: '1.0.0'
    }
  };

  console.log(`[CONFIG] Using definitions directory: ${config.definitionsDirectory}`);
  console.log(`[CONFIG] Server will start on port: ${config.port}`);
  console.log(`[CONFIG] MCP endpoint will be: ${config.mountPath}`);

  // Create and start server
  const server = new MCPServer(config);

  try {
    await server.start();
    console.log(`[SUCCESS] MCP Bridge Server started successfully!`);
    console.log(`[INFO] MCP endpoint: http://localhost:${config.port}${config.mountPath}`);
    console.log(`[INFO] Health check: http://localhost:${config.port}/health`);
    console.log(`[INFO] Server info: http://localhost:${config.port}/`);
    console.log('');
    console.log('[READY] Ready for AI agent integration!');
    console.log('');
    console.log('[EXAMPLE] Tool discovery:');
    console.log(`curl -X POST http://localhost:${config.port}${config.mountPath} \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'`);
    
    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n[SHUTDOWN] Received ${signal}, shutting down gracefully...`);
      try {
        await server.stop();
        console.log('[SUCCESS] Server stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('[ERROR] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Keep the process alive
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    process.on('uncaughtException', (error) => {
      console.error('[ERROR] Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error: any) {
    console.error('[ERROR] Failed to start server:', error.message);
    console.error('[ERROR] Error details:', error);
    process.exit(1);
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('[FATAL] Fatal error:', error);
    process.exit(1);
  });
}