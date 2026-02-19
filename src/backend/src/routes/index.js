import Router from 'koa-router';
import { registryController, authController } from '../controllers/registry.js';

const router = new Router();

router.get('/health', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

router.post('/auth/register', authController.register);
router.get('/auth/verify/:token', authController.verify);
router.post('/auth/login', authController.login);
router.get('/auth/whoami', authController.whoami);

router.get('/registry/skills/last10',        registryController.last10);
router.get('/registry/skills/mostDownloaded', registryController.mostDownloaded);
router.get('/registry/list',                 registryController.list);
router.get('/registry/search',               registryController.search);
router.get('/registry/mine',                 registryController.mine);
router.get('/registry/:name/files', registryController.files);
router.get('/registry/:name', registryController.metadata);
router.get('/registry/:name/-/:filename', registryController.tarball);
router.post('/registry/publish', registryController.publish);

export default router;
