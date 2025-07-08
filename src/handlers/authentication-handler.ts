import { HttpRequest } from '../types/openapi-mcp.types.js';
import { SecurityScheme } from '../types/openapi-mcp.types.js';
import { MCPProxyError, ErrorType } from '../types/errors.js';

export class AuthenticationHandler {
  applyAuth(
    request: HttpRequest, 
    authConfig: { type: string; credentials: Record<string, any> }
  ): HttpRequest {
    
    const updatedRequest = { ...request };
    
    switch (authConfig.type) {
      case 'basic':
        this.applyBasicAuth(updatedRequest, authConfig.credentials);
        break;
        
      case 'bearer':
        this.applyBearerAuth(updatedRequest, authConfig.credentials);
        break;
        
      case 'apiKey':
        this.applyApiKeyAuth(updatedRequest, authConfig.credentials);
        break;
        
      default:
        throw new MCPProxyError(
          ErrorType.AUTHENTICATION_FAILED,
          `Unsupported authentication type: ${authConfig.type}`
        );
    }
    
    return updatedRequest;
  }
  
  applySecurityScheme(
    request: HttpRequest,
    scheme: SecurityScheme,
    credentials: Record<string, any>
  ): HttpRequest {
    
    const updatedRequest = { ...request };
    
    switch (scheme.type) {
      case 'http':
        if (scheme.scheme === 'basic') {
          this.applyBasicAuth(updatedRequest, credentials);
        } else if (scheme.scheme === 'bearer') {
          this.applyBearerAuth(updatedRequest, credentials);
        } else {
          throw new MCPProxyError(
            ErrorType.AUTHENTICATION_FAILED,
            `Unsupported HTTP authentication scheme: ${scheme.scheme}`
          );
        }
        break;
        
      case 'apiKey':
        this.applyApiKeyAuthWithScheme(updatedRequest, scheme, credentials);
        break;
        
      case 'oauth2':
        // OAuth2 typically uses bearer tokens
        this.applyBearerAuth(updatedRequest, credentials);
        break;
        
      case 'openIdConnect':
        // OpenID Connect typically uses bearer tokens
        this.applyBearerAuth(updatedRequest, credentials);
        break;
        
      default:
        throw new MCPProxyError(
          ErrorType.AUTHENTICATION_FAILED,
          `Unsupported security scheme type: ${scheme.type}`
        );
    }
    
    return updatedRequest;
  }
  
  private applyBasicAuth(request: HttpRequest, credentials: Record<string, any>): void {
    const { username, password } = credentials;
    
    if (!username || !password) {
      throw new MCPProxyError(
        ErrorType.AUTHENTICATION_FAILED,
        'Basic authentication requires username and password'
      );
    }
    
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    request.headers['Authorization'] = `Basic ${auth}`;
  }
  
  private applyBearerAuth(request: HttpRequest, credentials: Record<string, any>): void {
    const { token } = credentials;
    
    if (!token) {
      throw new MCPProxyError(
        ErrorType.AUTHENTICATION_FAILED,
        'Bearer authentication requires a token'
      );
    }
    
    request.headers['Authorization'] = `Bearer ${token}`;
  }
  
  private applyApiKeyAuth(request: HttpRequest, credentials: Record<string, any>): void {
    const { key, name = 'X-API-Key', in: location = 'header' } = credentials;
    
    if (!key) {
      throw new MCPProxyError(
        ErrorType.AUTHENTICATION_FAILED,
        'API key authentication requires a key'
      );
    }
    
    switch (location) {
      case 'header':
        request.headers[name] = key;
        break;
        
      case 'query':
        if (!request.params) request.params = {};
        request.params[name] = key;
        break;
        
      case 'cookie':
        // Add cookie header
        const existingCookies = request.headers['Cookie'] || '';
        const newCookie = `${name}=${key}`;
        request.headers['Cookie'] = existingCookies 
          ? `${existingCookies}; ${newCookie}`
          : newCookie;
        break;
        
      default:
        throw new MCPProxyError(
          ErrorType.AUTHENTICATION_FAILED,
          `Unsupported API key location: ${location}`
        );
    }
  }
  
  private applyApiKeyAuthWithScheme(
    request: HttpRequest, 
    scheme: SecurityScheme, 
    credentials: Record<string, any>
  ): void {
    const { key } = credentials;
    
    if (!key) {
      throw new MCPProxyError(
        ErrorType.AUTHENTICATION_FAILED,
        'API key authentication requires a key'
      );
    }
    
    if (!scheme.name || !scheme.in) {
      throw new MCPProxyError(
        ErrorType.AUTHENTICATION_FAILED,
        'API key scheme requires name and location'
      );
    }
    
    switch (scheme.in) {
      case 'header':
        request.headers[scheme.name] = key;
        break;
        
      case 'query':
        if (!request.params) request.params = {};
        request.params[scheme.name] = key;
        break;
        
      case 'cookie':
        const existingCookies = request.headers['Cookie'] || '';
        const newCookie = `${scheme.name}=${key}`;
        request.headers['Cookie'] = existingCookies 
          ? `${existingCookies}; ${newCookie}`
          : newCookie;
        break;
        
      default:
        throw new MCPProxyError(
          ErrorType.AUTHENTICATION_FAILED,
          `Unsupported API key location: ${scheme.in}`
        );
    }
  }
  
  // Merge default credentials with tool-specific credentials
  mergeCredentials(
    defaultCredentials: Record<string, any> = {},
    toolCredentials: Record<string, any> = {}
  ): Record<string, any> {
    return {
      ...defaultCredentials,
      ...toolCredentials
    };
  }
}