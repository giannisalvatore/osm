import axios from 'axios';
import { CONFIG } from '../config.js';

const api = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function fetchSkills() {
  const response = await api.get('/skills');
  return response.data;
}

export async function searchSkills(query) {
  const response = await api.get(`/skills/search/${encodeURIComponent(query)}`);
  return response.data;
}

export async function fetchSkill(name) {
  const response = await api.get(`/skills/${name}`);
  return response.data;
}

export async function incrementDownloads(name) {
  try {
    await api.post(`/skills/${name}/download`);
  } catch (error) {
    // Silent fail, not critical
  }
}

export default api;
