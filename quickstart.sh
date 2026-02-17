#!/usr/bin/env bash

# Quick Start Script for OSMAgent MVP

echo "🚀 Starting OSMAgent MVP..."
echo ""

# Install root dependencies and setup workspaces
echo "📦 Installing root dependencies and setting up workspaces..."
npm install

# Install workspace dependencies
echo "📦 Installing backend dependencies..."
cd packages/backend && npm install && cd ../..

echo "📦 Installing frontend dependencies..."
cd packages/frontend && npm install && cd ../..

echo "📦 Installing CLI dependencies..."
cd packages/cli && npm install && cd ../..

# Seed database
echo "🌱 Seeding database with demo skills..."
cd packages/backend
node src/db/seed.js
cd ../..

echo ""
echo "✓ Setup complete!"
echo ""
echo "Start the services:"
echo ""
echo "  Terminal 1: npm run dev:backend   # Start API (port 3000)"
echo "  Terminal 2: npm run dev:frontend  # Start Web UI (port 4321)"
echo "  Terminal 3: ./install.sh          # Install CLI"
echo ""
echo "Then try:"
echo "  osm list"
echo "  osm i gmail-reader"
echo ""
