import { Request, Response, NextFunction } from 'express';
import { MCPProxyService } from '../services/mcp-proxy-service.js';
import { LibraryConfig } from '../types/config.js';

declare global {
  namespace Express {
    interface Request {
      mcpService?: MCPProxyService;
    }
  }
}

export function createExpressMiddleware(config: LibraryConfig) {
  const service = new MCPProxyService(config);
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // Attach service to request for health checks
    req.mcpService = service;
    
    // Handle MCP protocol over HTTP
    if (req.method === 'POST' && req.path === '/') {
      try {
        const { method, params } = req.body;
        
        if (method === 'tools/list') {
          const tools = await service.getAvailableTools();
          res.json({
            jsonrpc: '2.0',
            result: { tools },
            id: req.body.id
          });
        } else if (method === 'tools/call') {
          const result = await service.executeTool(params.name, params.arguments);
          res.json({
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }]
            },
            id: req.body.id
          });
        } else {
          res.status(404).json({
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: 'Method not found'
            },
            id: req.body.id
          });
        }
      } catch (error: any) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error.message
          },
          id: req.body.id
        });
      }
    } else {
      next();
    }
  };
}