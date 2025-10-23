#!/bin/bash

# Install dependencies
npm ci

# Build the application
npm run build

# Verify build output
if [ ! -d "out" ]; then
  echo "Build failed: out directory not found"
  exit 1
fi

echo "Build completed successfully!"
