#!/usr/bin/env bash
set -e

# OSMAgent CLI Installation Script
# Version: 1.0.0

echo "╔════════════════════════════════════════════════════╗"
echo "║     OSMAgent - Open Skills Marketplace CLI        ║"
echo "║               Installation Script                 ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js (v18 or higher) from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version 18 or higher is required${NC}"
    echo "Current version: $(node -v)"
    echo "Please upgrade Node.js from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
echo ""

# Create OSM directory
OSM_DIR="$HOME/.osm"
SKILLS_DIR="$OSM_DIR/skills"

echo -e "${BLUE}Creating OSM directories...${NC}"
mkdir -p "$OSM_DIR"
mkdir -p "$SKILLS_DIR"
echo -e "${GREEN}✓ Directories created: $OSM_DIR${NC}"
echo ""

# Install CLI package
echo -e "${BLUE}Installing OSM CLI globally...${NC}"

# Check if we're in the OSM repo
if [ -d "packages/cli" ]; then
    echo "Installing from local package..."
    cd packages/cli
    npm install
    npm link
    cd ../..
else
    # Install from npm (when published)
    echo "Installing from npm registry..."
    npm install -g osm-cli
fi

echo -e "${GREEN}✓ OSM CLI installed successfully!${NC}"
echo ""

# Verify installation
if command -v osm &> /dev/null; then
    echo -e "${GREEN}✓ Installation verified${NC}"
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║           Installation Complete! 🚀               ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "Get started with these commands:"
    echo ""
    echo -e "  ${YELLOW}osm list${NC}        - List all available skills"
    echo -e "  ${YELLOW}osm search${NC}      - Search for skills"
    echo -e "  ${YELLOW}osm i <skill>${NC}   - Install a skill"
    echo -e "  ${YELLOW}osm --help${NC}      - Show all commands"
    echo ""
    echo "Visit the marketplace: http://localhost:4321"
    echo "API Documentation: http://localhost:3000/health"
    echo ""
else
    echo -e "${RED}✗ Installation verification failed${NC}"
    echo "Please try running the installation script again"
    exit 1
fi
