#!/usr/bin/env node

/**
 * Import expenses from CSV
 * Format: date,description,amount,category
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';

const csvFile = process.argv[2];

if (!csvFile) {
  console.log('Usage: node import-csv.js <file.csv>');
  process.exit(1);
}

const content = fs.readFileSync(csvFile, 'utf-8');
const records = parse(content, {
  columns: true,
  skip_empty_lines: true
});

console.log(`Imported ${records.length} expenses`);
console.log(JSON.stringify(records, null, 2));
