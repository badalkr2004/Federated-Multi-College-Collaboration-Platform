import * as argon2 from 'argon2';
import { db } from '../../db/client.js';
import { colleges, collegeRequests, users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { errors } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { tenantCache } from '../../lib/tenantCache.js';
import { generateApiKey } from '../../lib/apiKey.js';
import { signToken } from '../../lib/jwt.js';
import { sendCollegeApprovalEmail, sendCollegeRejectionEmail } from '../../lib/email.js';
import type { College, CollegeRequest } from '../../db/schema/index.js';

// ── Super Admin Auth ─────────────────────────────────────────────────────────

export async function adminLogin(email: string, password: string): Promise<string> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || user.role !== 'super_admin') {
    throw errors.unauthorized('Invalid credentials');
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) throw errors.unauthorized('Invalid credentials');

  return signToken({
    userId: user.id,
    collegeId: null,
    collegeSlug: null,
    email: user.email,
    role: 'super_admin',
  });
}

// ── College Requests ─────────────────────────────────────────────────────────

export async function listPendingRequests(): Promise<CollegeRequest[]> {
  return db
    .select()
    .from(collegeRequests)
    .where(eq(collegeRequests.status, 'pending'))
    .orderBy(collegeRequests.requestedAt);
}

export async function listAllRequests(): Promise<CollegeRequest[]> {
  return db.select().from(collegeRequests).orderBy(collegeRequests.requestedAt);
}

export async function approveCollegeRequest(requestId: string, adminId: string): Promise<College> {
  const [request] = await db
    .select()
    .from(collegeRequests)
    .where(eq(collegeRequests.id, requestId))
    .limit(1);

  if (!request) throw errors.notFound('College request');
  if (request.status !== 'pending') throw errors.conflict('Request already reviewed');

  // Generate cryptographically secure API key
  const apiKey = generateApiKey();

  const [college] = await db
    .insert(colleges)
    .values({
      name: request.name,
      slug: request.slug,
      domain: request.domain,
      emailDomain: request.emailDomain,
      apiKey,
      isActive: true,
    })
    .returning();

  await db
    .update(collegeRequests)
    .set({ status: 'approved', reviewedAt: new Date(), reviewedBy: adminId })
    .where(eq(collegeRequests.id, requestId));

  // Invalidate cache so new domain resolves immediately
  tenantCache.delete(request.domain);

  sendCollegeApprovalEmail({
    to: request.contactEmail,
    contactName: request.contactName,
    collegeName: request.name,
    domain: request.domain,
    apiKey,
  }).catch((err) => logger.error({ err }, 'Failed to send approval email'));

  logger.info({ college: college!.slug, apiKey: apiKey.substring(0, 15) + '...' }, '✅ College approved and provisioned');

  return college!;
}

export async function rejectCollegeRequest(
  requestId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  const [request] = await db
    .select()
    .from(collegeRequests)
    .where(eq(collegeRequests.id, requestId))
    .limit(1);

  if (!request) throw errors.notFound('College request');
  if (request.status !== 'pending') throw errors.conflict('Request already reviewed');

  await db
    .update(collegeRequests)
    .set({ status: 'rejected', rejectionReason: reason, reviewedAt: new Date(), reviewedBy: adminId })
    .where(eq(collegeRequests.id, requestId));

  sendCollegeRejectionEmail({
    to: request.contactEmail,
    contactName: request.contactName,
    collegeName: request.name,
    reason,
  }).catch((err) => logger.error({ err }, 'Failed to send rejection email'));
}

// ── College Management ───────────────────────────────────────────────────────

export async function listColleges(): Promise<College[]> {
  return db.select().from(colleges).orderBy(colleges.createdAt);
}

export async function deactivateCollege(collegeId: string): Promise<void> {
  const [college] = await db
    .update(colleges)
    .set({ isActive: false })
    .where(eq(colleges.id, collegeId))
    .returning();

  if (!college) throw errors.notFound('College');

  // Evict from cache — next request from this domain gets 403
  tenantCache.delete(college.domain);
  logger.info({ domain: college.domain }, '⛔ College deactivated');
}
