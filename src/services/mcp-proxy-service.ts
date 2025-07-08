import * as fs from 'fs/promises';
import * as path from 'path';
import axios, { AxiosResponse } from 'axios';
import { LibraryConfig } from '../types/config.js';
import { 
  EnrichedDefinition, 
  ToolDefinition, 
  ValidationResult,
  HttpRequest,
  MCPTool 
} from '../types/openapi-mcp.types.js';
import { MCPProxyError, ErrorType } from '../types/errors.js';
import { OpenAPIDefinitionParser } from '../parsers/openapi-parser.js';
import { CustomizationConfigLoader } from '../parsers/customization-loader.js';
import { DefinitionEnricher } from '../enrichers/definition-enricher.js';
import { AuthenticationHandler } from '../handlers/authentication-handler.js';

export class MCPProxyService {
  private loadedDefinitions: Map<string, EnrichedDefinition> = new Map();
  private definitionParser: OpenAPIDefinitionParser;
  private customizationLoader: CustomizationConfigLoader;
  private definitionEnricher: DefinitionEnricher;
  private authHandler: AuthenticationHandler;
  
  constructor(private config: LibraryConfig) {
    this.definitionParser = new OpenAPIDefinitionParser();
    this.customizationLoader = new CustomizationConfigLoader();
    this.definitionEnricher = new DefinitionEnricher(config.cacheDirectory, config.forceRegeneration);
    this.authHandler = new AuthenticationHandler();
  }
  
  // MCP Tool Registry functionality
  async getAvailableTools(): Promise<MCPTool[]> {
    await this.loadAllDefinitions();
    
    const tools: MCPTool[] = [];
    
    for (const enriched of this.loadedDefinitions.values()) {
      for (const tool of enriched.tools) {
        tools.push({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        });
      }
    }
    
    return tools;
  }
  
  // Tool execution (combines MCP + Proxy)
  async executeTool(toolName: string, parameters: any = {}): Promise<any> {
    // Find the tool definition
    const toolDef = await this.findToolDefinition(toolName);
    if (!toolDef) {
      throw new MCPProxyError(
        ErrorType.MISSING_TOOL,
        `Tool '${toolName}' not found`
      );
    }
    
    // Validate parameters
    const validation = this.validateParameters(toolDef, parameters);
    if (!validation.valid) {
      throw new MCPProxyError(
        ErrorType.PARAMETER_VALIDATION,
        `Parameter validation failed: ${validation.errors.join(', ')}`,
        { errors: validation.errors }
      );
    }
    
    // Build HTTP request
    const httpRequest = this.buildHttpRequest(toolDef, parameters);
    
    // Apply authentication
    const authenticatedRequest = this.applyAuthentication(httpRequest, toolDef);
    
    // Execute HTTP request
    return this.executeHttpRequest(authenticatedRequest);
  }
  
  // Internal methods
  private async loadAllDefinitions(): Promise<void> {
    if (!this.config.definitionsDirectory) {
      throw new MCPProxyError(
        ErrorType.INVALID_OPENAPI,
        'No definitions directory specified'
      );
    }
    
    try {
      const files = await fs.readdir(this.config.definitionsDirectory);
      
      // Find all OpenAPI definition files (yaml/json)
      const definitionFiles = files.filter(file => 
        /\.(yaml|yml|json)$/.test(file) && !file.includes('.custom.')
      );
      
      for (const file of definitionFiles) {
        await this.loadDefinition(file);
      }
    } catch (error: any) {
      throw new MCPProxyError(
        ErrorType.INVALID_OPENAPI,
        `Failed to load definitions: ${error.message}`,
        { directory: this.config.definitionsDirectory, error }
      );
    }
  }
  
  private async loadDefinition(filename: string): Promise<void> {
    const filePath = path.join(this.config.definitionsDirectory, filename);
    
    try {
      // Parse OpenAPI definition
      const parsed = await this.definitionParser.parseFromFile(filePath);
      
      // Load customization config
      const customization = await this.customizationLoader.loadForDefinition(filePath);
      
      // Resolve environment variables in customization
      const resolvedCustomization = this.customizationLoader.resolveEnvironmentVariables(customization);
      
      // Enrich definition
      const enriched = await this.definitionEnricher.enrichDefinition(
        parsed,
        resolvedCustomization,
        filePath
      );
      
      // Store enriched definition
      this.loadedDefinitions.set(filename, enriched);
      
    } catch (error: any) {
      console.warn(`Failed to load definition ${filename}: ${error.message}`);
      // Continue loading other definitions
    }
  }
  
  private async findToolDefinition(toolName: string): Promise<ToolDefinition | null> {
    await this.loadAllDefinitions();
    
    for (const enriched of this.loadedDefinitions.values()) {
      const tool = enriched.tools.find(t => t.name === toolName);
      if (tool) {
        return tool;
      }
    }
    
    return null;
  }
  
  private validateParameters(tool: ToolDefinition, params: any): ValidationResult {
    const errors: string[] = [];
    const schema = tool.inputSchema;
    
    // Basic validation - check required fields
    if (schema.required && Array.isArray(schema.required)) {
      for (const required of schema.required) {
        if (params[required] === undefined || params[required] === null) {
          errors.push(`Missing required parameter: ${required}`);
        }
      }
    }
    
    // Additional validation could be added here using a JSON schema validator
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private buildHttpRequest(tool: ToolDefinition, params: any): HttpRequest {
    let url = tool.endpoint.url;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `openapi-mcp-server/${this.config.mcpOptions?.serverVersion || '1.0.0'}`
    };
    
    const queryParams: Record<string, any> = {};
    let body: any = undefined;
    
    // Apply predefined parameters first
    const allParams = { ...tool.predefinedParams, ...params };
    
    // Handle path parameters
    for (const [paramName, pathVar] of Object.entries(tool.parameterMapping.pathParams)) {
      const value = allParams[paramName];
      if (value !== undefined) {
        url = url.replace(`{${pathVar}}`, encodeURIComponent(String(value)));
      }
    }
    
    // Handle query parameters
    for (const paramName of tool.parameterMapping.queryParams) {
      const value = allParams[paramName];
      if (value !== undefined) {
        queryParams[paramName] = value;
      }
    }
    
    // Handle header parameters
    for (const paramName of tool.parameterMapping.headerParams) {
      const value = allParams[paramName];
      if (value !== undefined) {
        headers[paramName] = String(value);
      }
    }
    
    // Handle cookie parameters
    for (const paramName of tool.parameterMapping.cookieParams) {
      const value = allParams[paramName];
      if (value !== undefined) {
        const existingCookies = headers['Cookie'] || '';
        const newCookie = `${paramName}=${encodeURIComponent(String(value))}`;
        headers['Cookie'] = existingCookies 
          ? `${existingCookies}; ${newCookie}`
          : newCookie;
      }
    }
    
    // Handle request body
    if (tool.parameterMapping.bodySchema) {
      // For JSON bodies, collect all parameters not used elsewhere
      const bodyParams: any = {};
      for (const [key, value] of Object.entries(allParams)) {
        if (
          !tool.parameterMapping.pathParams[key] &&
          !tool.parameterMapping.queryParams.includes(key) &&
          !tool.parameterMapping.headerParams.includes(key) &&
          !tool.parameterMapping.cookieParams.includes(key)
        ) {
          bodyParams[key] = value;
        }
      }
      
      if (Object.keys(bodyParams).length > 0) {
        body = bodyParams;
      }
    }
    
    // Handle special 'body' parameter (for non-flattened body schemas)
    if (allParams.body && !tool.parameterMapping.bodySchema) {
      body = allParams.body;
    }
    
    return {
      method: tool.method,
      url,
      headers,
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      body
    };
  }
  
  private applyAuthentication(request: HttpRequest, tool: ToolDefinition): HttpRequest {
    // Apply authentication from tool configuration
    if (tool.authentication) {
      const credentials = this.authHandler.mergeCredentials(
        this.config.defaultCredentials,
        tool.authentication.credentials
      );
      
      return this.authHandler.applyAuth(request, {
        type: tool.authentication.type,
        credentials
      });
    }
    
    // If no tool-specific auth but we have default credentials, try to apply them
    if (this.config.defaultCredentials) {
      // Try to determine auth type from credentials
      let authType = 'unknown';
      if (this.config.defaultCredentials.username && this.config.defaultCredentials.password) {
        authType = 'basic';
      } else if (this.config.defaultCredentials.token) {
        authType = 'bearer';
      } else if (this.config.defaultCredentials.key) {
        authType = 'apiKey';
      }
      
      if (authType !== 'unknown') {
        return this.authHandler.applyAuth(request, {
          type: authType,
          credentials: this.config.defaultCredentials
        });
      }
    }
    
    return request;
  }
  
  private async executeHttpRequest(request: HttpRequest): Promise<any> {
    try {
      const axiosConfig: any = {
        method: request.method,
        url: request.url,
        headers: request.headers,
        timeout: 30000 // 30 second timeout
      };
      
      if (request.params) {
        axiosConfig.params = request.params;
      }
      
      if (request.body) {
        axiosConfig.data = request.body;
      }
      
      const response: AxiosResponse = await axios(axiosConfig);
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      };
      
    } catch (error: any) {
      if (error.response) {
        // HTTP error response
        return {
          error: true,
          status: error.response.status,
          statusText: error.response.statusText,
          message: error.message,
          data: error.response.data
        };
      } else if (error.request) {
        // Network error
        throw new MCPProxyError(
          ErrorType.NETWORK_ERROR,
          `Network error: ${error.message}`,
          { error }
        );
      } else {
        // Other error
        throw new MCPProxyError(
          ErrorType.API_REQUEST_FAILED,
          `Request failed: ${error.message}`,
          { error }
        );
      }
    }
  }
  
  // Utility methods
  async reloadDefinitions(): Promise<void> {
    this.loadedDefinitions.clear();
    await this.loadAllDefinitions();
  }
  
  getLoadedDefinitions(): string[] {
    return Array.from(this.loadedDefinitions.keys());
  }
  
  async cleanupCache(): Promise<void> {
    await this.definitionEnricher.cleanupCache();
  }
  
  getStatus(): { tools: MCPTool[]; definitions: string[] } {
    const tools: MCPTool[] = [];
    for (const enriched of this.loadedDefinitions.values()) {
      for (const tool of enriched.tools) {
        tools.push({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        });
      }
    }
    
    return {
      tools,
      definitions: Array.from(this.loadedDefinitions.keys())
    };
  }
}