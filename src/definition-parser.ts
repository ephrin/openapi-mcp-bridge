import { validate, bundle } from '@readme/openapi-parser';
import {createLogger} from "./logger.js";
export async function parseOpenapiDefinition(openapiDefinition: string) {
    const logger = createLogger();
    try {
        const result = await validate(openapiDefinition)

        if (!result.valid) {
            logger.warn(`Given definition (${openapiDefinition}) is not valid: ${JSON.stringify(result.warnings)}`);
        }

        return await bundle(openapiDefinition);
    } catch (e) {
        console.error(e);
    }
}