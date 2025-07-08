#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

// Help text
const helpText = `
OpenAPI MCP Bridge CLI

Usage: openapi-mcp-bridge [options]

Options:
  --definitions <dir>   Directory containing OpenAPI definitions (default: ./definitions)
  --cache-dir <dir>     Directory for caching (default: ./definitions/.cache)
  --no-cache            Disable caching
  --debug               Enable debug logging
  --help                Show this help message

Note: This CLI runs MCP server in stdio mode for integration with MCP clients.
For HTTP server mode, use the standalone server or framework integrations.

Environment Variables:
  OPENAPI_DEFINITIONS_DIR   Override definitions directory
  OPENAPI_CACHE_DIR         Override cache directory
  OPENAPI_FORCE_REGEN       Force cache regeneration (true/false)
  OPENAPI_USERNAME          Default username for authentication
  OPENAPI_PASSWORD          Default password for authentication
  OPENAPI_TOKEN             Default bearer token
  OPENAPI_API_KEY           Default API key

Examples:
  # Run with default settings
  openapi-mcp-bridge

  # Specify definitions directory
  openapi-mcp-bridge --definitions ./api-specs

  # Disable caching
  openapi-mcp-bridge --no-cache

  # Run in debug mode
  openapi-mcp-bridge --debug
`;

// Parse arguments
if (args.includes('--help') || args.includes('-h')) {
  console.log(helpText);
  process.exit(0);
}

// Build environment variables
const env = { ...process.env };

// Parse command line options
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--definitions':
      env.OPENAPI_DEFINITIONS_DIR = args[++i];
      break;
    case '--cache-dir':
      env.OPENAPI_CACHE_DIR = args[++i];
      break;
    case '--no-cache':
      env.OPENAPI_CACHE_DIR = '';
      break;
    case '--debug':
      env.DEBUG = 'true';
      break;
    case '--port':
    case '--mount-path':
      // These are for HTTP mode - not applicable in stdio mode
      console.error(`Error: ${args[i]} is not supported in stdio mode. Use standalone server or framework integrations for HTTP mode.`);
      process.exit(1);
  }
}

// Run the server
const serverPath = join(__dirname, 'server.js');
const serverProcess = spawn(process.execPath, [serverPath], {
  stdio: 'inherit',
  env
});

// Handle exit
serverProcess.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle signals
process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
});