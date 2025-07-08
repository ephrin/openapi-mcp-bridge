export enum ErrorType {
  INVALID_OPENAPI = 'invalid_openapi',
  MISSING_TOOL = 'missing_tool',
  PARAMETER_VALIDATION = 'parameter_validation',
  AUTHENTICATION_FAILED = 'authentication_failed',
  API_REQUEST_FAILED = 'api_request_failed',
  NETWORK_ERROR = 'network_error'
}

export class MCPProxyError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPProxyError';
  }
}