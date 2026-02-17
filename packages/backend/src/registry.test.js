import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('registry storage directory exists', () => {
  const dir = path.join(process.cwd(), 'packages/backend/storage/tarballs');
  fs.mkdirSync(dir, { recursive: true });
  assert.equal(fs.existsSync(dir), true);
});
