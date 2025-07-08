import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { MCPProxyService } from '../services/mcp-proxy-service.js';
import { LibraryConfig } from '../types/config.js';

declare module 'fastify' {
  interface FastifyInstance {
    mcpService: MCPProxyService;
  }
}

interface MCPRequest {
  jsonrpc: string;
  method: string;
  params?: any;
  id: string | number;
}

async function mcpPlugin(fastify: FastifyInstance, options: LibraryConfig) {
  const service = new MCPProxyService(options);
  
  // Decorate fastify instance with service
  fastify.decorate('mcpService', service);
  
  // Handle MCP protocol
  fastify.post<{ Body: MCPRequest }>('/', async (request, reply) => {
    const { method, params, id } = request.body;
    
    try {
      if (method === 'tools/list') {
        const tools = await service.getAvailableTools();
        return {
          jsonrpc: '2.0',
          result: { tools },
          id
        };
      } else if (method === 'tools/call') {
        const result = await service.executeTool(params.name, params.arguments);
        return {
          jsonrpc: '2.0',
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          },
          id
        };
      } else {
        reply.code(404);
        return {
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: 'Method not found'
          },
          id
        };
      }
    } catch (error: any) {
      reply.code(500);
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message
        },
        id
      };
    }
  });
}

export function createFastifyPlugin(config: LibraryConfig) {
  return async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
    return mcpPlugin(fastify, config);
  };
}