import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs-extra';
import * as tar from 'tar';
import os from 'os';
import path from 'path';
import { CONFIG } from '../config.js';
import { authHeaders } from './auth.js';

const api = axios.create({ baseURL: CONFIG.API_URL, timeout: 15000 });

export async function fetchMetadata(name) {
  const { data } = await api.get(`/registry/${encodeURIComponent(name)}`);
  return data;
}

export async function searchRegistry(query) {
  const { data } = await api.get('/registry/search', { params: { q: query } });
  return data;
}

export async function listRegistry(page = 1, limit = 20) {
  const { data } = await api.get('/registry/list', { params: { page, limit } });
  return data;
}

const MAX_TARBALL_BYTES = 1 * 1024 * 1024; // 1 MB

export async function publishPackage(manifest, tarballPath) {
  const buffer = await fs.readFile(tarballPath);
  if (buffer.length > MAX_TARBALL_BYTES) {
    throw new Error(
      `Skill package is too large (${(buffer.length / 1024).toFixed(0)} KB). Maximum allowed size is 1 MB.`
    );
  }
  const headers = await authHeaders();
  const { data } = await api.post('/registry/publish', {
    manifest,
    tarballBase64: buffer.toString('base64')
  }, { headers });
  return data;
}

export async function downloadTarball(url, destination, expectedShasum) {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  const content = Buffer.from(response.data);
  const actual = crypto.createHash('sha1').update(content).digest('hex');
  if (expectedShasum && actual !== expectedShasum) {
    throw new Error(`Checksum mismatch for ${url}`);
  }
  await fs.writeFile(destination, content);
}

export async function packCurrentDirectory(cwd = process.cwd()) {
  const tmpPath = path.join(os.tmpdir(), `osm-${Date.now()}.tgz`);
  const files = (await fs.readdir(cwd)).filter((entry) => !['node_modules', '.git'].includes(entry));
  await tar.create({ gzip: true, file: tmpPath, cwd }, files);
  return tmpPath;
}

export async function extractTarball(tarballPath, destDir) {
  await fs.ensureDir(destDir);
  await tar.x({ file: tarballPath, cwd: destDir, strip: 0 });
}
