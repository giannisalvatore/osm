import Router from 'koa-router';
import { registryController, authController } from '../controllers/registry.js';

const router = new Router();

router.get('/health', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

router.post('/auth/login', authController.login);
router.get('/auth/whoami', authController.whoami);

router.get('/registry/search', registryController.search);
router.get('/registry/:name', registryController.metadata);
router.get('/registry/:name/-/:filename', registryController.tarball);
router.post('/registry/publish', registryController.publish);

export default router;
