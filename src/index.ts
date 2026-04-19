import 'dotenv/config';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
  logger.info(`   Environment : ${env.NODE_ENV}`);
  logger.info(`   Frontend URL: ${env.FRONTEND_URL}`);
});

export default app;
