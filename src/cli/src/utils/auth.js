import fs from 'fs-extra';
import axios from 'axios';
import { CONFIG } from '../config.js';

const api = axios.create({ baseURL: CONFIG.API_URL, timeout: 10000 });

export async function saveToken(token) {
  await fs.ensureDir(CONFIG.GLOBAL_OSM_DIR);
  await fs.writeJson(CONFIG.TOKENS_FILE, { token }, { spaces: 2 });
}

export async function loadToken() {
  if (!(await fs.pathExists(CONFIG.TOKENS_FILE))) return null;
  const data = await fs.readJson(CONFIG.TOKENS_FILE);
  return data.token || null;
}

export async function login(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  await saveToken(data.token);
  return data;
}

export async function register(username, password, email) {
  const { data } = await api.post('/auth/register', { username, password, email });
  return data;
}

export async function whoami() {
  const token = await loadToken();
  const { data } = await api.get('/auth/whoami', { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function authHeaders() {
  const token = await loadToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
