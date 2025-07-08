import { ParsedPath, CustomizationConfig } from '../types/openapi-mcp.types.js';

export class ToolNameGenerator {
  constructor(private customization: CustomizationConfig = {}) {}
  
  generateToolName(parsedPath: ParsedPath): string {
    // First, try to use operationId if available
    if (parsedPath.operationId) {
      return this.applyAlias(parsedPath.operationId);
    }
    
    // Generate name from method and path
    const method = parsedPath.method.toLowerCase();
    const pathParts = this.extractPathParts(parsedPath.path);
    
    let toolName: string;
    
    if (pathParts.pathParams.length > 0) {
      // Include path parameters in the name: get-special-events-by-eventId
      const pathWithoutParams = pathParts.staticPath;
      const paramSuffix = pathParts.pathParams.map(param => `by-${param}`).join('-');
      toolName = `${method}-${pathWithoutParams}-${paramSuffix}`;
    } else {
      // Simple case: get-museum-hours
      toolName = `${method}-${pathParts.staticPath}`;
    }
    
    // Clean up the tool name
    toolName = this.sanitizeToolName(toolName);
    
    // Apply alias from customization
    return this.applyAlias(toolName);
  }
  
  private extractPathParts(path: string): {
    staticPath: string;
    pathParams: string[];
  } {
    const pathParams: string[] = [];
    let staticPath = path;
    
    // Extract path parameters like {eventId}, {ticketId}
    const paramRegex = /\{([^}]+)\}/g;
    let match;
    
    while ((match = paramRegex.exec(path)) !== null) {
      const paramName = match[1];
      pathParams.push(paramName);
      // Remove the parameter from the static path
      staticPath = staticPath.replace(match[0], '');
    }
    
    // Clean up the static path
    staticPath = staticPath
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/\/+$/, '') // Remove trailing slashes
      .replace(/\/+/g, '-') // Replace slashes with dashes
      .replace(/[^a-zA-Z0-9-]/g, '') // Remove special characters
      .replace(/-+/g, '-') // Collapse multiple dashes
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
    
    return { staticPath, pathParams };
  }
  
  private sanitizeToolName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // Keep only alphanumeric and dashes
      .replace(/-+/g, '-') // Collapse multiple dashes
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  }
  
  private applyAlias(toolName: string): string {
    if (this.customization.toolAliases?.[toolName]) {
      return this.customization.toolAliases[toolName];
    }
    return toolName;
  }
  
  // Get the original tool name without aliases (useful for reverse lookup)
  getOriginalToolName(parsedPath: ParsedPath): string {
    if (parsedPath.operationId) {
      return parsedPath.operationId;
    }
    
    const method = parsedPath.method.toLowerCase();
    const pathParts = this.extractPathParts(parsedPath.path);
    
    let toolName: string;
    
    if (pathParts.pathParams.length > 0) {
      const pathWithoutParams = pathParts.staticPath;
      const paramSuffix = pathParts.pathParams.map(param => `by-${param}`).join('-');
      toolName = `${method}-${pathWithoutParams}-${paramSuffix}`;
    } else {
      toolName = `${method}-${pathParts.staticPath}`;
    }
    
    return this.sanitizeToolName(toolName);
  }
}