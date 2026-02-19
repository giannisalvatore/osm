/**
 * OSM Discovery service entry point.
 *
 * Starts a minimal Koa HTTP server (for Docker health checks) and then
 * launches the background crawler loop.
 *
 * Exposed endpoints (internal only, not published via Traefik):
 *   GET /health   → { status, service, uptime, timestamp }
 *   GET /stats    → { repos_analyzed, skills_imported, last_analyzed_at }
 */

import 'dotenv/config';
import Koa    from 'koa';
import Router from '@koa/router';
import { initDatabase, DiscoveredRepo, Package } from './db.js';
import { runCrawler } from './crawler.js';

const PORT  = process.env.PORT  || 4000;
const START = Date.now();

const app    = new Koa();
const router = new Router();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');
  if (ctx.method === 'OPTIONS') { ctx.status = 204; return; }
  await next();
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.get('/health', async ctx => {
  ctx.body = {
    status:    'ok',
    service:   'osm-discovery',
    uptime_s:  Math.floor((Date.now() - START) / 1000),
    timestamp: new Date().toISOString(),
  };
});

router.get('/stats', async ctx => {
  try {
    const { Op } = await import('sequelize');
    const [reposAnalyzed, skillsDiscovered, skillsUserUploaded, lastRepo, totalSkills] = await Promise.all([
      DiscoveredRepo.count(),
      Package.count({ where: { source: 'github' } }),
      Package.count({ where: { source: { [Op.ne]: 'github' } } }),
      DiscoveredRepo.findOne({ order: [['analyzed_at', 'DESC']] }),
      Package.count(),
    ]);
    ctx.body = {
        repos_analyzed:      reposAnalyzed,
        skills_discovered:   skillsDiscovered,
        skills_user_uploaded: skillsUserUploaded,
        last_analyzed_at:    lastRepo?.analyzed_at ?? null,
        total_skills:        totalSkills,
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body   = { error: err.message };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function start() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`[discovery] 🔍 OSM Discovery running on port ${PORT}`);
    console.log(`[discovery] Health: http://localhost:${PORT}/health`);
    console.log(`[discovery] Stats:  http://localhost:${PORT}/stats`);
  });

  // Launch the crawler in the background; crash the process if it dies so
  // Docker (restart: unless-stopped) can revive it automatically.
  runCrawler().catch(err => {
    console.error('[discovery] Crawler crashed unexpectedly:', err);
    process.exit(1);
  });
}

start().catch(err => {
  console.error('[discovery] Startup failed:', err);
  process.exit(1);
});
