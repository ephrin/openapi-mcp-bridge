import { Context, Next } from 'koa';
import { MCPProxyService } from '../services/mcp-proxy-service.js';
import { LibraryConfig } from '../types/config.js';

declare module 'koa' {
  interface Context {
    mcpService?: MCPProxyService;
  }
}

export function createKoaMiddleware(config: LibraryConfig) {
  const service = new MCPProxyService(config);
  
  return async (ctx: Context, next: Next) => {
    // Attach service to context for health checks
    ctx.mcpService = service;
    
    // Handle MCP protocol over HTTP
    if (ctx.method === 'POST' && ctx.path === '/') {
      const body = (ctx.request as any).body;
      
      try {
        const { method, params } = body;
        
        if (method === 'tools/list') {
          const tools = await service.getAvailableTools();
          ctx.body = {
            jsonrpc: '2.0',
            result: { tools },
            id: body.id
          };
        } else if (method === 'tools/call') {
          const result = await service.executeTool(params.name, params.arguments);
          ctx.body = {
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }]
            },
            id: body.id
          };
        } else {
          ctx.status = 404;
          ctx.body = {
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: 'Method not found'
            },
            id: body.id
          };
        }
      } catch (error: any) {
        ctx.status = 500;
        ctx.body = {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error.message
          },
          id: body.id
        };
      }
    } else {
      await next();
    }
  };
}