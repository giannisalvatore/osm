import fs from 'fs-extra';
import { getProjectManifestPath } from '../config.js';

export async function readManifest(cwd = process.cwd()) {
  const manifestPath = getProjectManifestPath(cwd);
  if (!(await fs.pathExists(manifestPath))) {
    throw new Error('osm.json not found. Initialize your project manifest first.');
  }
  return fs.readJson(manifestPath);
}
