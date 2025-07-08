
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
    console.log(`✅ MCP Server started successfully!`);
    console.log(`📡 MCP endpoint: http://localhost:${server.port}${server.mountPath}`);
    console.log(`🏥 Health check: http://localhost:${server.port}/health`);
    
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
