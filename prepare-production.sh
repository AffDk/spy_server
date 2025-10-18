#!/bin/bash
# Railway deployment script - removes dev dependencies for production build

echo "Removing devDependencies from package.json for production deployment..."

# Create a temporary package.json without devDependencies
node -e "
const pkg = require('./package.json');
delete pkg.devDependencies;
require('fs').writeFileSync('package.json.prod', JSON.stringify(pkg, null, 2));
"

# Replace package.json with production version
mv package.json package.json.dev
mv package.json.prod package.json

echo "Production package.json created successfully"