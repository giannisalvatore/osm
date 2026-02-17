import Router from 'koa-router';
import { skillsController } from '../controllers/skills.js';

const router = new Router();

// Health check
router.get('/health', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

// Skills routes
router.get('/skills', skillsController.listSkills);
router.get('/skills/search/:query', skillsController.searchSkills);
router.get('/skills/:name', skillsController.getSkill);
router.post('/skills', skillsController.createSkill);
router.put('/skills/:name', skillsController.updateSkill);
router.post('/skills/:name/download', skillsController.incrementDownloads);

export default router;
