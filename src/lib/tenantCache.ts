import type { College } from '../db/schema/colleges.js';

/**
 * Shared in-memory cache for domain → college lookups.
 * Avoids a DB round-trip on every request.
 * Exported so admin service can invalidate on approve/deactivate.
 */
export const tenantCache = new Map<string, College>();
