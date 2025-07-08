import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { 
  ParsedDefinition, 
  CustomizationConfig, 
  EnrichedDefinition, 
  ToolDefinition 
} from '../types/openapi-mcp.types.js';
import { ToolNameGenerator } from '../generators/tool-name-generator.js';
import { SchemaConverter } from '../converters/schema-converter.js';
import { MCPProxyError, ErrorType } from '../types/errors.js';

export class DefinitionEnricher {
  constructor(
    private cacheDirectory?: string,
    private forceRegeneration: boolean = false
  ) {}
  
  async enrichDefinition(
    parsed: ParsedDefinition,
    customization: CustomizationConfig,
    sourceFile: string,
    customFile?: string
  ): Promise<EnrichedDefinition> {
    
    // Generate combined hash for caching
    const combinedHash = this.generateCombinedHash(parsed, customization);
    
    // Try to load from cache first (unless force regeneration is enabled)
    if (this.cacheDirectory && !this.forceRegeneration) {
      const cached = await this.tryLoadFromCache(combinedHash, sourceFile, customFile);
      if (cached) {
        return cached;
      }
    }
    
    // Generate enriched definition
    const enriched = await this.generateEnrichedDefinition(
      parsed,
      customization,
      sourceFile,
      customFile,
      combinedHash
    );
    
    // Save to cache
    if (this.cacheDirectory) {
      await this.saveToCache(enriched);
    }
    
    return enriched;
  }
  
  private async generateEnrichedDefinition(
    parsed: ParsedDefinition,
    customization: CustomizationConfig,
    sourceFile: string,
    customFile: string | undefined,
    hash: string
  ): Promise<EnrichedDefinition> {
    
    const toolNameGenerator = new ToolNameGenerator(customization);
    const schemaConverter = new SchemaConverter(customization);
    
    // Get server URL (use first server or empty string)
    const serverUrl = parsed.servers[0] || '';
    
    // Generate tools from paths
    const tools: ToolDefinition[] = [];
    
    for (const parsedPath of parsed.paths) {
      const originalToolName = toolNameGenerator.getOriginalToolName(parsedPath);
      const toolName = toolNameGenerator.generateToolName(parsedPath);
      
      // Generate input schema
      const inputSchema = schemaConverter.convertToMCPInputSchema(parsedPath, toolName);
      
      // Create parameter mapping
      const parameterMapping = schemaConverter.createParameterMapping(parsedPath);
      
      // Apply predefined parameters
      const predefinedParams = this.extractPredefinedParams(customization, toolName);
      
      // Extract authentication config
      const authentication = this.extractAuthenticationConfig(customization, toolName);
      
      const tool: ToolDefinition = {
        name: toolName,
        description: parsedPath.summary || parsedPath.description || `${parsedPath.method.toUpperCase()} ${parsedPath.path}`,
        method: parsedPath.method.toUpperCase(),
        endpoint: {
          path: parsedPath.path,
          url: serverUrl + parsedPath.path
        },
        inputSchema,
        parameterMapping,
        predefinedParams,
        security: parsedPath.security
      };
      
      if (authentication) {
        tool.authentication = authentication;
      }
      
      tools.push(tool);
    }
    
    return {
      hash,
      serverUrl,
      security: parsed.security,
      tools,
      metadata: {
        sourceFile,
        customFile,
        generatedAt: new Date().toISOString()
      }
    };
  }
  
  private extractPredefinedParams(customization: CustomizationConfig, toolName: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Add global predefined parameters
    if (customization.predefinedParameters?.global) {
      Object.assign(params, customization.predefinedParameters.global);
    }
    
    // Add endpoint-specific predefined parameters
    if (customization.predefinedParameters?.endpoints?.[toolName]) {
      Object.assign(params, customization.predefinedParameters.endpoints[toolName]);
    }
    
    return params;
  }
  
  private extractAuthenticationConfig(
    customization: CustomizationConfig, 
    toolName: string
  ): { type: string; credentials: Record<string, any> } | undefined {
    
    if (!customization.authenticationOverrides) return undefined;
    
    for (const override of customization.authenticationOverrides) {
      if (override.endpoint === '*' || override.endpoint === toolName) {
        // Determine auth type from credentials
        let type = 'unknown';
        if (override.credentials.username && override.credentials.password) {
          type = 'basic';
        } else if (override.credentials.token) {
          type = 'bearer';
        } else if (override.credentials.key) {
          type = 'apiKey';
        }
        
        return {
          type,
          credentials: override.credentials
        };
      }
    }
    
    return undefined;
  }
  
  private generateCombinedHash(parsed: ParsedDefinition, customization: CustomizationConfig): string {
    const combined = {
      parsed: parsed.hash,
      customization: JSON.stringify(customization, Object.keys(customization).sort())
    };
    
    return crypto.createHash('sha256').update(JSON.stringify(combined)).digest('hex');
  }
  
  private async tryLoadFromCache(
    hash: string,
    sourceFile: string,
    customFile?: string
  ): Promise<EnrichedDefinition | null> {
    
    if (!this.cacheDirectory) return null;
    
    try {
      const cacheFile = path.join(this.cacheDirectory, `${hash}.enriched.json`);
      await fs.access(cacheFile);
      
      const content = await fs.readFile(cacheFile, 'utf-8');
      const enriched: EnrichedDefinition = JSON.parse(content);
      
      // Verify the cache is still valid by checking if source files exist and haven't changed
      if (await this.isCacheValid(enriched, sourceFile, customFile)) {
        return enriched;
      }
    } catch (error) {
      // Cache miss or invalid cache, continue with generation
    }
    
    return null;
  }
  
  private async isCacheValid(
    enriched: EnrichedDefinition,
    sourceFile: string,
    customFile?: string
  ): Promise<boolean> {
    try {
      // Check if source file still exists
      await fs.access(sourceFile);
      
      // Check if custom file exists (if specified in cache)
      if (enriched.metadata.customFile) {
        await fs.access(enriched.metadata.customFile);
      }
      
      // Could add more sophisticated validation here (file modification times, etc.)
      return true;
    } catch {
      return false;
    }
  }
  
  private async saveToCache(enriched: EnrichedDefinition): Promise<void> {
    if (!this.cacheDirectory) return;
    
    try {
      // Ensure cache directory exists
      await fs.mkdir(this.cacheDirectory, { recursive: true });
      
      const cacheFile = path.join(this.cacheDirectory, `${enriched.hash}.enriched.json`);
      await fs.writeFile(cacheFile, JSON.stringify(enriched, null, 2), 'utf-8');
      
      // Also save a hash file for easy identification
      const hashFile = path.join(this.cacheDirectory, `${enriched.hash}.hash`);
      await fs.writeFile(hashFile, enriched.hash, 'utf-8');
      
    } catch (error: any) {
      // Don't throw on cache save failures, just log
      console.warn(`Failed to save to cache: ${error.message}`);
    }
  }
  
  async cleanupCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.cacheDirectory) return;
    
    try {
      const files = await fs.readdir(this.cacheDirectory);
      const now = Date.now();
      
      for (const file of files) {
        if (file.endsWith('.enriched.json') || file.endsWith('.hash')) {
          const filePath = path.join(this.cacheDirectory, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error: any) {
      console.warn(`Failed to cleanup cache: ${error.message}`);
    }
  }
}