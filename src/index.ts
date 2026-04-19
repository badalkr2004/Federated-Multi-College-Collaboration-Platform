import 'dotenv/config';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
  logger.info(`   Environment   : ${env.NODE_ENV}`);
  logger.info(`   Domain suffix : ${env.DOMAIN_SUFFIX}`);
  logger.info(`   Tenant A      : http://projects.a.${env.DOMAIN_SUFFIX}:${env.PORT}`);
  logger.info(`   Tenant B      : http://projects.b.${env.DOMAIN_SUFFIX}:${env.PORT}`);
  logger.info(`   Admin login   : POST http://localhost:${env.PORT}/api/v1/admin/auth/login`);
});

export default app;
