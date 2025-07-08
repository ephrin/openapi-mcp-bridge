#!/bin/bash

echo "🚀 Preparing openapi-mcp-bridge for npm publish..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this script from the project root."
  exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Run build
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

# Run type checking
echo "🔍 Type checking..."
npm run typecheck

if [ $? -ne 0 ]; then
  echo "❌ Type checking failed"
  exit 1
fi

# Run linting
echo "🧪 Linting..."
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# Check for required files
echo "📋 Checking required files..."
required_files=("README.md" "LICENSE" "CHANGELOG.md" "dist/index.js" "dist/index.d.ts")
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing required file: $file"
    exit 1
  fi
done

echo "✅ All checks passed!"
echo ""
echo "📦 Package is ready for publishing. To publish, run:"
echo "   npm publish --access public"
echo ""
echo "🏷️  Current version: $(node -p "require('./package.json').version")"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Update version in package.json"
echo "   2. Update CHANGELOG.md"
echo "   3. Commit all changes"
echo "   4. Create a git tag: git tag v$(node -p "require('./package.json').version")"