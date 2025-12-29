#!/bin/bash
set -e
echo "Starting frontend build..."
npm install --legacy-peer-deps
npm run build
echo "Build completed successfully!"

