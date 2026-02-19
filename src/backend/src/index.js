import 'dotenv/config';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import router from './routes/index.js';
import { initDatabase } from './db/database.js';

const app = new Koa();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser({ jsonLimit: '20mb' }));

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      error: err.message
    };
    console.error('Error:', err);
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 OSMAgent Backend running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});

export default app;
