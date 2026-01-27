#!/usr/bin/env bash
# Build script for Render

echo "Building React frontend..."

# Install dependencies
npm install

# Build the application
npm run build

echo "Build completed successfully!"