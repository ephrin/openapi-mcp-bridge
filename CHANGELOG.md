# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-08

### Added
- Initial release of openapi-mcp-bridge
- Core functionality to convert OpenAPI definitions to MCP tools
- Support for OpenAPI 3.0 and 3.1 specifications
- Automatic parameter flattening (path, query, body parameters)
- Smart tool naming with customizable aliases
- Authentication support (Basic, Bearer, API Key)
- Hash-based caching with force regeneration option
- Framework integrations:
  - Express.js middleware
  - Koa.js middleware
  - Fastify plugin
  - Standalone server
- CLI tool for direct usage
- Comprehensive examples for all integration patterns
- TypeScript support with full type definitions
- Environment variable configuration
- Customization via YAML configuration files