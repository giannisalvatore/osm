import test from 'node:test';
import assert from 'node:assert/strict';
import semver from 'semver';

test('semver works for dependency resolution ranges', () => {
  assert.equal(semver.satisfies('1.2.3', '^1.0.0'), true);
  assert.equal(semver.satisfies('2.0.0', '^1.0.0'), false);
});
