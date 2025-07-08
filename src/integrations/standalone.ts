import express, { Express } from 'express';
import { Server as HTTPServer } from 'http';
import { MCPProxyService } from '../services/mcp-proxy-service.js';
import { LibraryConfig } from '../types/config.js';
import { createExpressMiddleware } from './express.js';

export interface MCPServerConfig extends LibraryConfig {
  port?: number;
  mountPath?: string;
}

export class MCPServer {
  private app: Express;
  private server?: HTTPServer;
  private service: MCPProxyService;
  public readonly port: number;
  public readonly mountPath: string;
  
  constructor(config: MCPServerConfig) {
    this.port = config.port || 3000;
    this.mountPath = config.mountPath || '/';
    this.service = new MCPProxyService(config);
    
    // Create Express app
    this.app = express();
    this.app.use(express.json());
    
    // Mount MCP middleware
    const middleware = createExpressMiddleware(config);
    this.app.use(this.mountPath, middleware);
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const status = this.service.getStatus();
      res.json({
        status: 'healthy',
        toolCount: status.tools.length,
        definitionsLoaded: status.definitions.length,
        uptime: process.uptime()
      });
    });
    
    // Root endpoint (if not mounted at root)
    if (this.mountPath !== '/') {
      this.app.get('/', (req, res) => {
        res.json({
          message: 'OpenAPI-to-MCP Server',
          endpoints: {
            mcp: this.mountPath,
            health: '/health'
          }
        });
      });
    }
  }
  
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`MCP Server listening on port ${this.port}`);
        console.log(`MCP endpoint: http://localhost:${this.port}${this.mountPath}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        resolve();
      }).on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          const newError = new Error(`Port ${this.port} is already in use. Please choose a different port or stop the service using this port.`);
          newError.cause = error;
          reject(newError);
        } else {
          reject(error);
        }
      });
    });
  }
  
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
  
  getService(): MCPProxyService {
    return this.service;
  }
  
  getStatus() {
    return this.service.getStatus();
  }
}