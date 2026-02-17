#!/usr/bin/env node

/**
 * Add a new RSS feed source
 */

import fs from 'fs';
import yaml from 'js-yaml';

const name = process.argv[2];
const url = process.argv[3];
const category = process.argv[4] || 'other';

if (!name || !url) {
  console.log('Usage: node add-source.js <name> <url> [category]');
  process.exit(1);
}

const sourcesFile = '../references/sources.yaml';
const sources = yaml.load(fs.readFileSync(sourcesFile, 'utf8'));

sources.sources.push({ name, url, category });

fs.writeFileSync(sourcesFile, yaml.dump(sources));
console.log(`✓ Added ${name} to sources`);
