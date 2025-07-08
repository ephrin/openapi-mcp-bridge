#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Create a CommonJS wrapper for each module
function createCjsWrapper(modulePath) {
  const relativePath = relative(distDir, modulePath).replace(/\\/g, '/');
  const moduleDir = dirname(modulePath);
  const cjsPath = modulePath.replace('.js', '.cjs');
  
  // Calculate relative path from CJS file to JS file (same directory)
  const jsFileName = relative(moduleDir, modulePath).replace(/\\/g, '/');
  
  const wrapper = `// CommonJS wrapper for ${relativePath}
module.exports = (async () => {
  const module = await import('./${jsFileName}');
  return module;
})();
`;
  
  writeFileSync(cjsPath, wrapper);
  console.log(`Created CJS wrapper: ${relative(rootDir, cjsPath)}`);
}

// Process directory recursively
function processDirectory(dir) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js') && !file.endsWith('.cjs')) {
      createCjsWrapper(fullPath);
    }
  }
}

// Create main entry points
const mainModules = [
  'index.js',
  'cli.js',
  'integrations/express.js',
  'integrations/koa.js',
  'integrations/fastify.js'
];

console.log('Building CommonJS wrappers...');

for (const module of mainModules) {
  const modulePath = join(distDir, module);
  try {
    const stat = statSync(modulePath);
    if (stat.isFile()) {
      createCjsWrapper(modulePath);
    }
  } catch (err) {
    console.warn(`Module not found: ${module}`);
  }
}

console.log('CommonJS build complete!');