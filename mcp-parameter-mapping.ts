// ============================================================================
// MCP Tool Parameter to OpenAPI Request Mapping
// ============================================================================

interface ToolDefinition {
  name: string;
  description: string;
  method: string;
  endpoint: {
    path: string; // e.g., "/special-events/{eventId}"
    url: string;  // full URL with server
  };
  inputSchema: any; // Flattened MCP schema
  parameterMapping: ParameterMappingInfo;
  predefinedParams: Record<string, any>;
}

interface ParameterMappingInfo {
  pathParams: string[];           // ["eventId", "ticketId"]
  queryParams: string[];          // ["startDate", "page", "limit"]
  headerParams: string[];         // ["Authorization", "X-API-Key"]
  bodyParams: string[];           // ["name", "location", "dates", "price"]
  bodySchema?: any;               // Original OpenAPI body schema
}

interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

// ============================================================================
// Parameter Mapper Class
// ============================================================================

class ParameterMapper {
  
  /**
   * Maps flattened MCP parameters back to OpenAPI request structure
   */
  mapMCPToOpenAPI(
    tool: ToolDefinition, 
    mcpParams: Record<string, any>
  ): HttpRequest {
    
    // 1. Merge predefined parameters with runtime parameters
    const allParams = this.mergeParameters(tool.predefinedParams, mcpParams);
    
    // 2. Build the complete HTTP request
    const request: HttpRequest = {
      method: tool.method,
      url: this.buildURL(tool.endpoint, allParams, tool.parameterMapping),
      headers: this.buildHeaders(allParams, tool.parameterMapping),
    };
    
    // 3. Add body if needed
    if (tool.parameterMapping.bodyParams.length > 0) {
      request.body = this.buildRequestBody(allParams, tool.parameterMapping);
    }
    
    return request;
  }
  
  /**
   * Merge predefined parameters with runtime MCP parameters
   * Runtime parameters take precedence over predefined ones
   */
  private mergeParameters(
    predefined: Record<string, any>,
    runtime: Record<string, any>
  ): Record<string, any> {
    return { ...predefined, ...runtime };
  }
  
  /**
   * Build complete URL with path parameters and query string
   */
  private buildURL(
    endpoint: { path: string; url: string },
    params: Record<string, any>,
    mapping: ParameterMappingInfo
  ): string {
    // 1. Replace path parameters in URL
    let url = endpoint.url + endpoint.path;
    
    mapping.pathParams.forEach(paramName => {
      const paramValue = params[paramName];
      if (paramValue !== undefined) {
        url = url.replace(`{${paramName}}`, encodeURIComponent(String(paramValue)));
      }
    });
    
    // 2. Add query parameters
    const queryParams = new URLSearchParams();
    mapping.queryParams.forEach(paramName => {
      const paramValue = params[paramName];
      if (paramValue !== undefined) {
        if (Array.isArray(paramValue)) {
          // Handle array query parameters (e.g., ?tags=a&tags=b)
          paramValue.forEach(value => queryParams.append(paramName, String(value)));
        } else {
          queryParams.set(paramName, String(paramValue));
        }
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }
  
  /**
   * Build request headers from header parameters
   */
  private buildHeaders(
    params: Record<string, any>,
    mapping: ParameterMappingInfo
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'openapi-mcp-server/1.0.0'
    };
    
    mapping.headerParams.forEach(paramName => {
      const paramValue = params[paramName];
      if (paramValue !== undefined) {
        headers[paramName] = String(paramValue);
      }
    });
    
    return headers;
  }
  
  /**
   * Build JSON request body from body parameters
   */
  private buildRequestBody(
    params: Record<string, any>,
    mapping: ParameterMappingInfo
  ): any {
    const body: Record<string, any> = {};
    
    mapping.bodyParams.forEach(paramName => {
      const paramValue = params[paramName];
      if (paramValue !== undefined) {
        body[paramName] = paramValue;
      }
    });
    
    return Object.keys(body).length > 0 ? body : undefined;
  }
}

// ============================================================================
// Tool Definition Generation (OpenAPI -> MCP)
// ============================================================================

class ToolDefinitionGenerator {
  
  /**
   * Generate MCP tool definition with mapping info from OpenAPI path
   */
  generateToolDefinition(parsedPath: ParsedPath, serverUrl: string): ToolDefinition {
    const parameterMapping = this.analyzeParameters(parsedPath);
    
    return {
      name: this.generateToolName(parsedPath.method, parsedPath.path),
      description: parsedPath.summary || parsedPath.description || `${parsedPath.method} ${parsedPath.path}`,
      method: parsedPath.method.toUpperCase(),
      endpoint: {
        path: parsedPath.path,
        url: serverUrl
      },
      inputSchema: this.generateInputSchema(parsedPath, parameterMapping),
      parameterMapping,
      predefinedParams: {}
    };
  }
  
  /**
   * Analyze OpenAPI parameters and categorize them
   */
  private analyzeParameters(parsedPath: ParsedPath): ParameterMappingInfo {
    const pathParams: string[] = [];
    const queryParams: string[] = [];
    const headerParams: string[] = [];
    const bodyParams: string[] = [];
    
    // Categorize parameters by location
    parsedPath.parameters?.forEach(param => {
      switch (param.in) {
        case 'path':
          pathParams.push(param.name);
          break;
        case 'query':
          queryParams.push(param.name);
          break;
        case 'header':
          headerParams.push(param.name);
          break;
      }
    });
    
    // Extract body parameter names
    const bodySchema = parsedPath.requestBody?.content?.['application/json']?.schema;
    if (bodySchema?.properties) {
      bodyParams.push(...Object.keys(bodySchema.properties));
    }
    
    return {
      pathParams,
      queryParams,
      headerParams,
      bodyParams,
      bodySchema
    };
  }
  
  /**
   * Generate flattened input schema for MCP tool
   */
  private generateInputSchema(
    parsedPath: ParsedPath,
    mapping: ParameterMappingInfo
  ): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    // Add all parameters as flat properties
    parsedPath.parameters?.forEach(param => {
      properties[param.name] = {
        ...param.schema,
        description: param.description
      };
      if (param.required) {
        required.push(param.name);
      }
    });
    
    // Add body properties
    const bodySchema = parsedPath.requestBody?.content?.['application/json']?.schema;
    if (bodySchema?.properties) {
      Object.assign(properties, bodySchema.properties);
      if (bodySchema.required) {
        required.push(...bodySchema.required);
      }
    }
    
    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined
    };
  }
  
  private generateToolName(method: string, path: string): string {
    const pathParts = path
      .split('/')
      .filter(p => p)
      .map(part => part.startsWith('{') 
        ? `by-${part.slice(1, -1)}` 
        : part.replace(/[^a-zA-Z0-9]/g, '-')
      );
    
    return `${method.toLowerCase()}-${pathParts.join('-')}`;
  }
}

// ============================================================================
// Concrete Examples
// ============================================================================

// Example 1: GET /museum-hours?startDate=2024-01-01&page=1&limit=10
const museumHoursExample = {
  // MCP Tool Definition
  tool: {
    name: "get-museum-hours",
    method: "GET",
    endpoint: {
      path: "/museum-hours",
      url: "https://api.fake-museum-example.com/v1.1"
    },
    parameterMapping: {
      pathParams: [],
      queryParams: ["startDate", "page", "limit"],
      headerParams: [],
      bodyParams: [],
    },
    predefinedParams: {
      page: 1,
      limit: 10
    }
  } as ToolDefinition,
  
  // MCP Parameters (flattened)
  mcpParams: {
    startDate: "2024-01-01",
    limit: 20  // Overrides predefined
  },
  
  // Expected HTTP Request
  expectedRequest: {
    method: "GET",
    url: "https://api.fake-museum-example.com/v1.1/museum-hours?startDate=2024-01-01&page=1&limit=20",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "openapi-mcp-server/1.0.0"
    }
  }
};

// Example 2: POST /special-events with body
const createEventExample = {
  // MCP Tool Definition  
  tool: {
    name: "post-special-events",
    method: "POST",
    endpoint: {
      path: "/special-events",
      url: "https://api.fake-museum-example.com/v1.1"
    },
    parameterMapping: {
      pathParams: [],
      queryParams: [],
      headerParams: [],
      bodyParams: ["name", "location", "eventDescription", "dates", "price"],
    },
    predefinedParams: {
      organizer: "museum-staff"
    }
  } as ToolDefinition,
  
  // MCP Parameters (flattened)
  mcpParams: {
    name: "Contemporary Art Exhibition",
    location: "Main Gallery",
    eventDescription: "A stunning collection of modern art",
    dates: ["2024-02-15", "2024-02-16"],
    price: 25.00
  },
  
  // Expected HTTP Request
  expectedRequest: {
    method: "POST",
    url: "https://api.fake-museum-example.com/v1.1/special-events",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "openapi-mcp-server/1.0.0"
    },
    body: {
      name: "Contemporary Art Exhibition",
      location: "Main Gallery", 
      eventDescription: "A stunning collection of modern art",
      dates: ["2024-02-15", "2024-02-16"],
      price: 25.00,
      organizer: "museum-staff" // From predefined params
    }
  }
};

// Example 3: GET /special-events/{eventId} with path parameter
const getEventExample = {
  // MCP Tool Definition
  tool: {
    name: "get-special-events-by-eventId",
    method: "GET",
    endpoint: {
      path: "/special-events/{eventId}",
      url: "https://api.fake-museum-example.com/v1.1"
    },
    parameterMapping: {
      pathParams: ["eventId"],
      queryParams: [],
      headerParams: [],
      bodyParams: [],
    },
    predefinedParams: {}
  } as ToolDefinition,
  
  // MCP Parameters (flattened)
  mcpParams: {
    eventId: "dad4bce8-f5cb-4078-a211-995864315e39"
  },
  
  // Expected HTTP Request
  expectedRequest: {
    method: "GET",
    url: "https://api.fake-museum-example.com/v1.1/special-events/dad4bce8-f5cb-4078-a211-995864315e39",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "openapi-mcp-server/1.0.0"
    }
  }
};

// ============================================================================
// Usage in MCPProxyService
// ============================================================================

class MCPProxyService {
  private parameterMapper = new ParameterMapper();
  
  async executeTool(toolName: string, mcpParameters: any): Promise<any> {
    // 1. Get tool definition
    const tool = this.getToolDefinition(toolName);
    
    // 2. Map MCP parameters to HTTP request
    const httpRequest = this.parameterMapper.mapMCPToOpenAPI(tool, mcpParameters);
    
    // 3. Apply authentication
    const authenticatedRequest = this.applyAuthentication(httpRequest, tool);
    
    // 4. Execute HTTP request
    const response = await this.executeHttpRequest(authenticatedRequest);
    
    // 5. Return MCP-formatted response
    return this.formatMCPResponse(response);
  }
  
  private getToolDefinition(toolName: string): ToolDefinition {
    // Load from cache or generate from OpenAPI definition
    throw new Error("Implementation needed");
  }
  
  private applyAuthentication(request: HttpRequest, tool: ToolDefinition): HttpRequest {
    // Apply authentication headers/params based on tool configuration
    return request;
  }
  
  private async executeHttpRequest(request: HttpRequest): Promise<any> {
    // Use axios or fetch to execute the request
    throw new Error("Implementation needed");
  }
  
  private formatMCPResponse(response: any): any {
    // Format response for MCP protocol
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }
}