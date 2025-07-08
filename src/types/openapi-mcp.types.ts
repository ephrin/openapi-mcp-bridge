export interface ParsedDefinition {
  servers: string[];
  paths: ParsedPath[];
  security: SecurityScheme[];
  hash: string;
}

export interface ParsedPath {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters: ParsedParameter[];
  requestBody?: ParsedRequestBody;
  responses: Record<string, any>;
  security?: any[];
}

export interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  schema: any;
  description?: string;
  style?: string;
  explode?: boolean;
}

export interface ParsedRequestBody {
  required: boolean;
  content: Record<string, { schema: any }>;
  description?: string;
}

export interface SecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme?: string; // for http type
  bearerFormat?: string; // for http bearer
  in?: 'header' | 'query' | 'cookie'; // for apiKey
  name?: string; // for apiKey
  flows?: any; // for oauth2
  openIdConnectUrl?: string; // for openIdConnect
}

export interface CustomizationConfig {
  toolAliases?: Record<string, string>;
  predefinedParameters?: {
    global?: Record<string, any>;
    endpoints?: Record<string, Record<string, any>>;
  };
  authenticationOverrides?: {
    endpoint: string; // "*" for all, or specific tool name
    credentials: Record<string, any>;
  }[];
}

export interface EnrichedDefinition {
  hash: string;
  serverUrl: string;
  security: SecurityScheme[];
  tools: ToolDefinition[];
  metadata: {
    sourceFile: string;
    customFile?: string;
    generatedAt: string;
  };
}

export interface ToolDefinition {
  name: string; // e.g., "get-special-events-by-eventId"
  description: string;
  method: string;
  endpoint: {
    path: string; // e.g., "/special-events/{eventId}"
    url: string;  // full URL with server
  };
  inputSchema: any; // JSON Schema for MCP tool
  parameterMapping: {
    pathParams: Record<string, string>; // param name -> path position
    queryParams: string[];
    headerParams: string[];
    cookieParams: string[];
    bodySchema?: any;
  };
  authentication?: {
    type: string;
    credentials: Record<string, any>;
  };
  predefinedParams: Record<string, any>;
  security?: any[];
}

export interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  params?: Record<string, any>; // query params
  body?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema
}