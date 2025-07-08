import { bundle } from '@readme/openapi-parser';
import { OpenAPIV3 } from 'openapi-types';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ParsedDefinition, ParsedPath, ParsedParameter, ParsedRequestBody, SecurityScheme } from '../types/openapi-mcp.types.js';
import { MCPProxyError, ErrorType } from '../types/errors.js';

export class OpenAPIDefinitionParser {
  async parseFromFile(filePath: string): Promise<ParsedDefinition> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Bundle the OpenAPI spec (resolves all $refs)
      const bundled = await bundle(filePath) as OpenAPIV3.Document;
      
      // Extract relevant information
      const servers = this.extractServers(bundled);
      const paths = this.extractPaths(bundled);
      const security = this.extractSecuritySchemes(bundled);
      
      // Generate hash of the content
      const content = await fs.readFile(filePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      return {
        servers,
        paths,
        security,
        hash
      };
    } catch (error: any) {
      throw new MCPProxyError(
        ErrorType.INVALID_OPENAPI,
        `Failed to parse OpenAPI definition: ${error.message}`,
        { filePath, error }
      );
    }
  }
  
  private extractServers(spec: OpenAPIV3.Document): string[] {
    return (spec.servers || []).map(server => {
      let url = server.url;
      // Handle server variables
      if (server.variables) {
        for (const [key, variable] of Object.entries(server.variables)) {
          const value = variable.default || '';
          url = url.replace(`{${key}}`, value);
        }
      }
      return url;
    });
  }
  
  private extractPaths(spec: OpenAPIV3.Document): ParsedPath[] {
    const paths: ParsedPath[] = [];
    
    if (!spec.paths) return paths;
    
    for (const [pathString, pathItem] of Object.entries(spec.paths)) {
      if (!pathItem) continue;
      
      // Process each HTTP method
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'] as const;
      
      for (const method of methods) {
        const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
        if (!operation) continue;
        
        const parsedPath: ParsedPath = {
          path: pathString,
          method,
          operationId: operation.operationId,
          summary: operation.summary,
          description: operation.description,
          parameters: this.extractParameters(operation, pathItem, spec),
          requestBody: this.extractRequestBody(operation),
          responses: operation.responses || {},
          security: operation.security
        };
        
        paths.push(parsedPath);
      }
    }
    
    return paths;
  }
  
  private extractParameters(
    operation: OpenAPIV3.OperationObject,
    pathItem: OpenAPIV3.PathItemObject,
    spec: OpenAPIV3.Document
  ): ParsedParameter[] {
    const parameters: ParsedParameter[] = [];
    
    // Combine path-level and operation-level parameters
    const allParams = [
      ...(pathItem.parameters || []),
      ...(operation.parameters || [])
    ];
    
    for (const paramOrRef of allParams) {
      let param: OpenAPIV3.ParameterObject;
      
      // Resolve reference if needed
      if ('$ref' in paramOrRef) {
        const refPath = paramOrRef.$ref.replace('#/', '').split('/');
        param = this.resolveReference(spec, refPath) as OpenAPIV3.ParameterObject;
      } else {
        param = paramOrRef as OpenAPIV3.ParameterObject;
      }
      
      if (!param.name) continue;
      
      parameters.push({
        name: param.name,
        in: param.in as 'path' | 'query' | 'header' | 'cookie',
        required: param.required || false,
        schema: param.schema || {},
        description: param.description,
        style: param.style,
        explode: param.explode
      });
    }
    
    return parameters;
  }
  
  private resolveReference(spec: any, refPath: string[]): any {
    let resolved: any = spec;
    for (const segment of refPath) {
      resolved = resolved?.[segment];
    }
    return resolved;
  }
  
  private extractRequestBody(operation: OpenAPIV3.OperationObject): ParsedRequestBody | undefined {
    if (!operation.requestBody || !('content' in operation.requestBody)) {
      return undefined;
    }
    
    const requestBody = operation.requestBody;
    
    return {
      required: requestBody.required || false,
      content: requestBody.content as Record<string, { schema: any }>,
      description: requestBody.description
    };
  }
  
  private extractSecuritySchemes(spec: OpenAPIV3.Document): SecurityScheme[] {
    const schemes: SecurityScheme[] = [];
    
    if (!spec.components?.securitySchemes) return schemes;
    
    for (const [name, schemeOrRef] of Object.entries(spec.components.securitySchemes)) {
      if (!('type' in schemeOrRef)) continue; // Skip reference objects
      
      const scheme = schemeOrRef as OpenAPIV3.SecuritySchemeObject;
      
      const securityScheme: SecurityScheme = {
        type: scheme.type as any
      };
      
      // Add type-specific properties
      if (scheme.type === 'http') {
        securityScheme.scheme = scheme.scheme;
        if (scheme.scheme === 'bearer') {
          securityScheme.bearerFormat = scheme.bearerFormat;
        }
      } else if (scheme.type === 'apiKey') {
        securityScheme.in = scheme.in as 'header' | 'query' | 'cookie' | undefined;
        securityScheme.name = scheme.name;
      } else if (scheme.type === 'oauth2') {
        securityScheme.flows = scheme.flows;
      } else if (scheme.type === 'openIdConnect') {
        securityScheme.openIdConnectUrl = scheme.openIdConnectUrl;
      }
      
      schemes.push(securityScheme);
    }
    
    return schemes;
  }
}