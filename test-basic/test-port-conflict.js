// Test port conflict error handling
import { MCPServer } from '../dist/integrations/standalone.js';

async function testPortConflict() {
  console.log('Testing port conflict error handling...');
  
  const server1 = new MCPServer({
    definitionsDirectory: '.',
    port: 3000,
    mountPath: '/mcp'
  });
  
  const server2 = new MCPServer({
    definitionsDirectory: '.',
    port: 3000,
    mountPath: '/mcp'
  });
  
  try {
    // Start first server
    await server1.start();
    console.log('✅ First server started successfully');
    
    // Try to start second server on same port
    await server2.start();
    console.log('❌ Second server should have failed but succeeded');
    
  } catch (error) {
    console.log('✅ Port conflict detected correctly:', error.message);
    
    // Clean up
    await server1.stop();
    console.log('✅ First server stopped');
  }
}

testPortConflict().catch(console.error);