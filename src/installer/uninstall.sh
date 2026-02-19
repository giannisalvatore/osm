#!/usr/bin/env bash
set -e

echo "Uninstalling OSM CLI..."

# Unlink/uninstall CLI
if command -v osm &> /dev/null; then
    npm uninstall -g osm-cli 2>/dev/null || npm unlink -g osm-cli 2>/dev/null || true
    echo "✓ OSM CLI removed"
fi

# Ask if user wants to remove data
read -p "Remove OSM data directory (~/.osm)? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$HOME/.osm"
    echo "✓ OSM data directory removed"
else
    echo "OSM data directory preserved at ~/.osm"
fi

echo "✓ Uninstallation complete"
