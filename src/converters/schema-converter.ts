import { ParsedPath, ParsedParameter, ParsedRequestBody, CustomizationConfig } from '../types/openapi-mcp.types.js';

export class SchemaConverter {
  constructor(private customization: CustomizationConfig = {}) {}
  
  convertToMCPInputSchema(
    parsedPath: ParsedPath,
    toolName: string
  ): any {
    const inputSchema: any = {
      type: "object",
      properties: {},
      required: []
    };
    
    // Add parameters to schema
    for (const param of parsedPath.parameters) {
      this.addParameterToSchema(inputSchema, param);
    }
    
    // Add request body properties to schema (flatten body into main schema)
    if (parsedPath.requestBody) {
      this.addRequestBodyToSchema(inputSchema, parsedPath.requestBody);
    }
    
    // Apply predefined parameters
    this.applyPredefinedParameters(inputSchema, toolName);
    
    return inputSchema;
  }
  
  private addParameterToSchema(schema: any, param: ParsedParameter): void {
    // Convert OpenAPI schema to JSON Schema
    const jsonSchema = this.convertOpenAPISchemaToJSONSchema(param.schema);
    
    schema.properties[param.name] = {
      ...jsonSchema,
      description: param.description
    };
    
    if (param.required) {
      schema.required.push(param.name);
    }
  }
  
  private addRequestBodyToSchema(schema: any, requestBody: ParsedRequestBody): void {
    // Handle different content types
    const supportedContentTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];
    
    for (const contentType of supportedContentTypes) {
      const content = requestBody.content[contentType];
      if (content?.schema) {
        const bodySchema = this.convertOpenAPISchemaToJSONSchema(content.schema);
        
        if (contentType === 'application/json') {
          // For JSON, flatten the body properties into the main schema
          this.flattenObjectSchema(schema, bodySchema, requestBody.required);
        } else {
          // For form data, add as a single 'body' property
          schema.properties.body = bodySchema;
          if (requestBody.required) {
            schema.required.push('body');
          }
        }
        break; // Use the first supported content type found
      }
    }
  }
  
  private flattenObjectSchema(targetSchema: any, sourceSchema: any, required: boolean): void {
    if (sourceSchema.type === 'object' && sourceSchema.properties) {
      // Merge properties
      Object.assign(targetSchema.properties, sourceSchema.properties);
      
      // Merge required fields
      if (sourceSchema.required && Array.isArray(sourceSchema.required)) {
        targetSchema.required.push(...sourceSchema.required);
      }
    } else {
      // If it's not an object, add it as a 'body' property
      targetSchema.properties.body = sourceSchema;
      if (required) {
        targetSchema.required.push('body');
      }
    }
  }
  
  private convertOpenAPISchemaToJSONSchema(openApiSchema: any): any {
    if (!openApiSchema) return {};
    
    // Handle basic types
    const jsonSchema: any = {
      type: openApiSchema.type
    };
    
    // Copy common properties
    if (openApiSchema.format) jsonSchema.format = openApiSchema.format;
    if (openApiSchema.description) jsonSchema.description = openApiSchema.description;
    if (openApiSchema.example !== undefined) jsonSchema.example = openApiSchema.example;
    if (openApiSchema.default !== undefined) jsonSchema.default = openApiSchema.default;
    if (openApiSchema.enum) jsonSchema.enum = openApiSchema.enum;
    if (openApiSchema.pattern) jsonSchema.pattern = openApiSchema.pattern;
    if (openApiSchema.minimum !== undefined) jsonSchema.minimum = openApiSchema.minimum;
    if (openApiSchema.maximum !== undefined) jsonSchema.maximum = openApiSchema.maximum;
    if (openApiSchema.minLength !== undefined) jsonSchema.minLength = openApiSchema.minLength;
    if (openApiSchema.maxLength !== undefined) jsonSchema.maxLength = openApiSchema.maxLength;
    if (openApiSchema.minItems !== undefined) jsonSchema.minItems = openApiSchema.minItems;
    if (openApiSchema.maxItems !== undefined) jsonSchema.maxItems = openApiSchema.maxItems;
    
    // Handle array type
    if (openApiSchema.type === 'array' && openApiSchema.items) {
      jsonSchema.items = this.convertOpenAPISchemaToJSONSchema(openApiSchema.items);
    }
    
    // Handle object type
    if (openApiSchema.type === 'object') {
      if (openApiSchema.properties) {
        jsonSchema.properties = {};
        for (const [key, value] of Object.entries(openApiSchema.properties)) {
          jsonSchema.properties[key] = this.convertOpenAPISchemaToJSONSchema(value);
        }
      }
      
      if (openApiSchema.required) {
        jsonSchema.required = openApiSchema.required;
      }
      
      if (openApiSchema.additionalProperties !== undefined) {
        if (typeof openApiSchema.additionalProperties === 'boolean') {
          jsonSchema.additionalProperties = openApiSchema.additionalProperties;
        } else {
          jsonSchema.additionalProperties = this.convertOpenAPISchemaToJSONSchema(openApiSchema.additionalProperties);
        }
      }
    }
    
    // Handle composition keywords (allOf, oneOf, anyOf)
    if (openApiSchema.allOf) {
      jsonSchema.allOf = openApiSchema.allOf.map((schema: any) => 
        this.convertOpenAPISchemaToJSONSchema(schema)
      );
    }
    
    if (openApiSchema.oneOf) {
      jsonSchema.oneOf = openApiSchema.oneOf.map((schema: any) => 
        this.convertOpenAPISchemaToJSONSchema(schema)
      );
    }
    
    if (openApiSchema.anyOf) {
      jsonSchema.anyOf = openApiSchema.anyOf.map((schema: any) => 
        this.convertOpenAPISchemaToJSONSchema(schema)
      );
    }
    
    return jsonSchema;
  }
  
  private applyPredefinedParameters(schema: any, toolName: string): void {
    const predefined = this.customization.predefinedParameters;
    if (!predefined) return;
    
    // Apply global predefined parameters
    if (predefined.global) {
      for (const [key, value] of Object.entries(predefined.global)) {
        if (schema.properties[key]) {
          schema.properties[key].default = value;
        }
      }
    }
    
    // Apply endpoint-specific predefined parameters
    if (predefined.endpoints?.[toolName]) {
      for (const [key, value] of Object.entries(predefined.endpoints[toolName])) {
        if (schema.properties[key]) {
          schema.properties[key].default = value;
        }
      }
    }
  }
  
  createParameterMapping(parsedPath: ParsedPath): {
    pathParams: Record<string, string>;
    queryParams: string[];
    headerParams: string[];
    cookieParams: string[];
    bodySchema?: any;
  } {
    const mapping = {
      pathParams: {} as Record<string, string>,
      queryParams: [] as string[],
      headerParams: [] as string[],
      cookieParams: [] as string[]
    };
    
    // Map parameters by their location
    for (const param of parsedPath.parameters) {
      switch (param.in) {
        case 'path':
          mapping.pathParams[param.name] = param.name;
          break;
        case 'query':
          mapping.queryParams.push(param.name);
          break;
        case 'header':
          mapping.headerParams.push(param.name);
          break;
        case 'cookie':
          mapping.cookieParams.push(param.name);
          break;
      }
    }
    
    // Add request body schema if present
    let bodySchema: any = undefined;
    if (parsedPath.requestBody?.content) {
      const jsonContent = parsedPath.requestBody.content['application/json'];
      if (jsonContent?.schema) {
        bodySchema = this.convertOpenAPISchemaToJSONSchema(jsonContent.schema);
      }
    }
    
    return {
      ...mapping,
      bodySchema
    };
  }
}