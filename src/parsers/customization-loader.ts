import * as fs from 'fs/promises';
import * as path from 'path';
import yaml from 'yaml';
import { CustomizationConfig } from '../types/openapi-mcp.types.js';
import { MCPProxyError, ErrorType } from '../types/errors.js';

export class CustomizationConfigLoader {
  async loadFromFile(filePath: string): Promise<CustomizationConfig> {
    try {
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // If customization file doesn't exist, return empty config
        return {};
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse YAML content
      const parsed = yaml.parse(content);
      
      // Validate and structure the config
      return this.validateConfig(parsed);
    } catch (error: any) {
      throw new MCPProxyError(
        ErrorType.INVALID_OPENAPI,
        `Failed to load customization config: ${error.message}`,
        { filePath, error }
      );
    }
  }
  
  async loadForDefinition(definitionPath: string): Promise<CustomizationConfig> {
    // Generate customization file path from definition path
    const dir = path.dirname(definitionPath);
    const basename = path.basename(definitionPath, path.extname(definitionPath));
    const customizationPath = path.join(dir, `${basename}.custom.yaml`);
    
    return this.loadFromFile(customizationPath);
  }
  
  private validateConfig(config: any): CustomizationConfig {
    if (typeof config !== 'object' || config === null) {
      return {};
    }
    
    const validatedConfig: CustomizationConfig = {};
    
    // Validate toolAliases
    if (config.toolAliases && typeof config.toolAliases === 'object') {
      validatedConfig.toolAliases = {};
      for (const [key, value] of Object.entries(config.toolAliases)) {
        if (typeof value === 'string') {
          validatedConfig.toolAliases[key] = value;
        }
      }
    }
    
    // Validate predefinedParameters
    if (config.predefinedParameters && typeof config.predefinedParameters === 'object') {
      validatedConfig.predefinedParameters = {};
      
      if (config.predefinedParameters.global && typeof config.predefinedParameters.global === 'object') {
        validatedConfig.predefinedParameters.global = config.predefinedParameters.global;
      }
      
      if (config.predefinedParameters.endpoints && typeof config.predefinedParameters.endpoints === 'object') {
        validatedConfig.predefinedParameters.endpoints = {};
        for (const [endpoint, params] of Object.entries(config.predefinedParameters.endpoints)) {
          if (typeof params === 'object' && params !== null) {
            validatedConfig.predefinedParameters.endpoints[endpoint] = params;
          }
        }
      }
    }
    
    // Validate authenticationOverrides
    if (Array.isArray(config.authenticationOverrides)) {
      validatedConfig.authenticationOverrides = [];
      for (const override of config.authenticationOverrides) {
        if (
          typeof override === 'object' &&
          override !== null &&
          typeof override.endpoint === 'string' &&
          typeof override.credentials === 'object' &&
          override.credentials !== null
        ) {
          validatedConfig.authenticationOverrides.push({
            endpoint: override.endpoint,
            credentials: override.credentials
          });
        }
      }
    }
    
    return validatedConfig;
  }
  
  resolveEnvironmentVariables(config: CustomizationConfig): CustomizationConfig {
    const resolved = JSON.parse(JSON.stringify(config)); // Deep clone
    
    // Resolve environment variables in authentication overrides
    if (resolved.authenticationOverrides) {
      for (const override of resolved.authenticationOverrides) {
        this.resolveObjectEnvironmentVars(override.credentials);
      }
    }
    
    // Resolve environment variables in predefined parameters
    if (resolved.predefinedParameters?.global) {
      this.resolveObjectEnvironmentVars(resolved.predefinedParameters.global);
    }
    
    if (resolved.predefinedParameters?.endpoints) {
      for (const params of Object.values(resolved.predefinedParameters.endpoints)) {
        this.resolveObjectEnvironmentVars(params as Record<string, any>);
      }
    }
    
    return resolved;
  }
  
  private resolveObjectEnvironmentVars(obj: Record<string, any>): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Replace ${VAR_NAME} with environment variable values
        obj[key] = value.replace(/\$\{([^}]+)\}/g, (match, envVar) => {
          return process.env[envVar] || match;
        });
      } else if (typeof value === 'object' && value !== null) {
        this.resolveObjectEnvironmentVars(value);
      }
    }
  }
}