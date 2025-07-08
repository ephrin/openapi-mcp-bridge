const express = require('express');
const { createExpressMiddleware } = require('openapi-mcp-bridge/express');

const app = express();

// Configure the MCP middleware
app.use('/mcp', createExpressMiddleware({
    definitionsDirectory: './api-definitions',
    defaultCredentials: {
      username: process.env.MUSEUM_USER,
      password: process.env.MUSEUM_PASS
    },
    logging: { consoleFallback: true }
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    const service = req.mcpService; // Available via middleware
    if (service) {
      const status = service.getStatus();
      res.json({
        status: 'healthy',
        toolCount: status.tools.length,
        definitionsLoaded: status.definitions.length
      });
    } else {
      res.json({
        status: 'healthy',
        message: 'MCP service not yet initialized'
      });
    }
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'OpenAPI-to-MCP Express Integration Example',
      endpoints: {
        mcp: '/mcp',
        health: '/health'
      }
    });
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
  console.log(`MCP server available at http://localhost:${PORT}/mcp`);
  console.log(`Health check at http://localhost:${PORT}/health`);
});