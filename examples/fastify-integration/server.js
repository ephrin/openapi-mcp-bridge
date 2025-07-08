const Fastify = require('fastify');
const { createFastifyPlugin } = require('openapi-mcp-bridge/fastify');

async function build() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      prettyPrint: process.env.NODE_ENV === 'development'
    }
  });

  // Register MCP plugin
  await fastify.register(createFastifyPlugin({
    definitionsDirectory: './api-definitions',
    defaultCredentials: {
      username: process.env.MUSEUM_USER,
      password: process.env.MUSEUM_PASS
    },
    logging: { consoleFallback: true }
  }), {
    prefix: '/mcp'
  });

  // Health check route
  fastify.get('/health', async (request, reply) => {
    const service = fastify.mcpService; // Available via plugin
    if (service) {
      const status = service.getStatus();
      return {
        status: 'healthy',
        toolCount: status.tools.length,
        definitionsLoaded: status.definitions.length,
        uptime: process.uptime()
      };
    } else {
      return {
        status: 'healthy',
        message: 'MCP service not yet initialized',
        uptime: process.uptime()
      };
    }
  });

  // Root route
  fastify.get('/', async (request, reply) => {
    return {
      message: 'OpenAPI-to-MCP Fastify Integration Example',
      framework: 'Fastify',
      version: require('./package.json').version,
      endpoints: {
        mcp: '/mcp',
        health: '/health',
        docs: '/documentation'
      }
    };
  });

  // Optional: Add Swagger documentation
  await fastify.register(require('@fastify/swagger'), {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: 'OpenAPI-to-MCP Fastify Example',
        description: 'Example integration of OpenAPI-to-MCP with Fastify',
        version: '1.0.0'
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json']
    },
    exposeRoute: true
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
      error: true,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  });

  return fastify;
}

async function start() {
  const fastify = await build();
  
  try {
    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    
    console.log(`🚀 Fastify server running on port ${PORT}`);
    console.log(`📡 MCP server available at http://localhost:${PORT}/mcp`);
    console.log(`🏥 Health check at http://localhost:${PORT}/health`);
    console.log(`📚 API docs at http://localhost:${PORT}/documentation`);
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      await fastify.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      await fastify.close();
      process.exit(0);
    });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { build };