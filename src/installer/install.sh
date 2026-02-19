#!/usr/bin/env bash
set -e

# OSM CLI Installation Script

OSM_BASE_URL="${OSM_BASE_URL:-https://www.osmagent.com}"
OSM_API_URL="${OSM_API_URL:-https://api.osmagent.com}"

echo "╔════════════════════════════════════════════════════╗"
echo "║          osm - Open Skills Manager                ║"
echo "║               Installation Script                 ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ── Check Node.js ────────────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js (v18 or higher) from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version 18 or higher is required (current: $(node -v))${NC}"
    echo "Please upgrade from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# ── Check npm ────────────────────────────────────────────────────────────────
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
echo ""

# ── Create OSM directories ───────────────────────────────────────────────────
OSM_DIR="$HOME/.osm"
echo -e "${BLUE}Creating OSM directories...${NC}"
mkdir -p "$OSM_DIR/skills" "$OSM_DIR/cache"
echo -e "${GREEN}✓ $OSM_DIR${NC}"
echo ""

# ── Download and install CLI ─────────────────────────────────────────────────
echo -e "${BLUE}Downloading OSM CLI from ${OSM_BASE_URL}...${NC}"

TMP_DIR=$(mktemp -d)
TMP_TGZ="$TMP_DIR/osm-cli.tgz"

if command -v curl &> /dev/null; then
    curl -fsSL "${OSM_BASE_URL}/osm-cli.tgz" -o "$TMP_TGZ"
elif command -v wget &> /dev/null; then
    wget -qO "$TMP_TGZ" "${OSM_BASE_URL}/osm-cli.tgz"
else
    echo -e "${RED}✗ curl or wget is required${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Downloaded${NC}"
echo ""

echo -e "${BLUE}Installing OSM CLI globally...${NC}"
npm install -g "$TMP_TGZ"
rm -rf "$TMP_DIR"
echo -e "${GREEN}✓ Installed${NC}"
echo ""

# ── Write API URL to shell profiles ─────────────────────────────────────────
echo -e "${BLUE}Configuring OSM registry URL...${NC}"
for PROFILE in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
  if [ -f "$PROFILE" ]; then
    # Remove any existing OSM_API_URL line to avoid duplicates
    grep -v 'OSM_API_URL' "$PROFILE" > "${PROFILE}.tmp" && mv "${PROFILE}.tmp" "$PROFILE"
    echo "export OSM_API_URL=\"${OSM_API_URL}\"" >> "$PROFILE"
  fi
done
export OSM_API_URL="$OSM_API_URL"
echo -e "${GREEN}✓ Registry: ${OSM_API_URL}${NC}"
echo ""

# ── Verify ───────────────────────────────────────────────────────────────────
if command -v osm &> /dev/null; then
    echo -e "${GREEN}✓ Installation verified ($(osm --version 2>/dev/null || echo 'osm ready'))${NC}"
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║              Installation Complete!               ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "Available commands:"
    echo ""
    echo -e "  ${YELLOW}osm search <query>${NC}             Search for skills by name or description"
    echo -e "  ${YELLOW}osm install <skill>${NC}            Install a skill  (alias: i)"
    echo -e "  ${YELLOW}osm update [skill]${NC}             Update a skill or all skills  (alias: u)"
    echo -e "  ${YELLOW}osm uninstall <skill>${NC}          Uninstall a skill  (alias: remove, rm)"
    echo -e "  ${YELLOW}osm create <skill-name>${NC}        Scaffold a new skill in the current directory"
    echo -e "  ${YELLOW}osm publish [version]${NC}          Publish skill from current directory"
    echo -e "  ${YELLOW}osm signup <user> <pass>${NC}       Create a new account"
    echo -e "  ${YELLOW}osm login <user> <pass>${NC}        Authenticate and store local token"
    echo -e "  ${YELLOW}osm whoami${NC}                     Show current authenticated user"
    echo ""
    echo -e "  ${YELLOW}osm --help${NC}                     Show help"
    echo ""
    echo "Marketplace: ${OSM_BASE_URL}"
    echo ""
else
    echo -e "${RED}✗ Installation verification failed${NC}"
    echo "Try adding npm's global bin to your PATH:"
    echo "  export PATH=\"\$(npm config get prefix)/bin:\$PATH\""
    exit 1
fi
