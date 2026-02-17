import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import router from './routes/index.js';
import { initDatabase } from './db/database.js';

const app = new Koa();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

// Middleware
app.use(cors());
app.use(bodyParser());

// Error handling
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

// Routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OSMAgent Backend running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /skills`);
  console.log(`   GET  /skills/:name`);
  console.log(`   GET  /skills/search/:query`);
  console.log(`   POST /skills`);
  console.log(`   PUT  /skills/:name`);
});

export default app;
