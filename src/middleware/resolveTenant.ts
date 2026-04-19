import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/client.js';
import { colleges } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { tenantCache } from '../lib/tenantCache.js';
import { logger } from '../lib/logger.js';

export async function resolveTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  const host = req.hostname; // Express strips port automatically

  // 1. Check in-memory cache first (avoids DB round-trip on every request)
  let college = tenantCache.get(host);

  if (!college) {
    const result = await db
      .select()
      .from(colleges)
      .where(and(eq(colleges.domain, host), eq(colleges.isActive, true)))
      .limit(1);

    if (!result[0]) {
      logger.warn({ host }, 'Unknown tenant domain');
      res.status(403).json({
        success: false,
        error: { code: 'UNKNOWN_TENANT', message: `Domain '${host}' is not registered on this platform` },
      });
      return;
    }

    college = result[0];
    tenantCache.set(host, college); // cache after first successful lookup
  }

  // 2. On auth routes: cross-validate X-College-Key header
  // On other protected routes, JWT cross-check handles tenant verification
  if (req.path.includes('/auth/register') || req.path.includes('/auth/login')) {
    const clientKey = req.headers['x-college-key'] as string | undefined;
    if (!clientKey || clientKey !== college.apiKey) {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_KEY_MISMATCH', message: 'X-College-Key does not match this domain' },
      });
      return;
    }
  }

  req.tenant = college;
  next();
}
