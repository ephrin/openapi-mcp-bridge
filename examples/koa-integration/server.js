const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const { createKoaMiddleware } = require('openapi-mcp-bridge/koa');

const app = new Koa();
const router = new Router();

// Add body parser middleware
app.use(bodyParser());

// Configure MCP middleware
const mcpMiddleware = createKoaMiddleware({
  definitionsDirectory: './api-definitions',
  defaultCredentials: {
    username: process.env.MUSEUM_USER,
    password: process.env.MUSEUM_PASS
  },
  logging: { consoleFallback: true }
});

// Mount MCP middleware
app.use(async (ctx, next) => {
  if (ctx.path.startsWith('/mcp')) {
    ctx.path = ctx.path.replace('/mcp', '');
    await mcpMiddleware(ctx, next);
  } else {
    await next();
  }
});

// Health check route
router.get('/health', async (ctx) => {
  const service = ctx.mcpService; // Available via middleware
  if (service) {
    const status = service.getStatus();
    ctx.body = {
      status: 'healthy',
      toolCount: status.tools.length,
      definitionsLoaded: status.definitions.length
    };
  } else {
    ctx.body = {
      status: 'healthy',
      message: 'MCP service not yet initialized'
    };
  }
});

// Root route
router.get('/', async (ctx) => {
  ctx.body = {
    message: 'OpenAPI-to-MCP Koa Integration Example',
    framework: 'Koa.js',
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    }
  };
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: true,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    console.error('Error:', err);
  }
});

// Apply routes
app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Koa server running on port ${PORT}`);
  console.log(`📡 MCP server available at http://localhost:${PORT}/mcp`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
});