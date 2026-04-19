import { db } from '../../db/client.js';
import { colleges, collegeRequests } from '../../db/schema/index.js';
import { or, eq, and, ne } from 'drizzle-orm';
import { errors } from '../../lib/errors.js';
import { notifyAdminOfNewRequest } from '../../lib/email.js';
import { logger } from '../../lib/logger.js';
import type { CollegeRequestInput } from './onboarding.schema.js';
import type { CollegeRequest } from '../../db/schema/index.js';

export async function submitCollegeRequest(data: CollegeRequestInput): Promise<CollegeRequest> {
  // Auto-derive slug from college name
  const slug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');

  // Check for duplicate domain or slug across colleges
  const existingCollege = await db
    .select({ id: colleges.id })
    .from(colleges)
    .where(or(eq(colleges.slug, slug), eq(colleges.domain, data.domain)))
    .limit(1);

  if (existingCollege[0]) {
    throw errors.conflict('A college with this domain or name is already registered');
  }

  // Check for duplicate domain or slug across active/pending requests
  const existingRequest = await db
    .select({ id: collegeRequests.id })
    .from(collegeRequests)
    .where(
      and(
        or(eq(collegeRequests.slug, slug), eq(collegeRequests.domain, data.domain)),
        ne(collegeRequests.status, 'rejected'), // rejected can reapply
      ),
    )
    .limit(1);

  if (existingRequest[0]) {
    throw errors.conflict('A pending or approved request already exists for this domain or name');
  }

  const [request] = await db
    .insert(collegeRequests)
    .values({ ...data, slug, status: 'pending' })
    .returning();

  // Fire-and-forget admin notification
  notifyAdminOfNewRequest(request!).catch((err) => logger.error({ err }, 'Failed to notify admin'));

  return request!;
}

export async function getRequestStatus(
  id: string,
): Promise<Pick<CollegeRequest, 'id' | 'status' | 'rejectionReason' | 'requestedAt' | 'reviewedAt'>> {
  const [request] = await db
    .select({
      id: collegeRequests.id,
      status: collegeRequests.status,
      rejectionReason: collegeRequests.rejectionReason,
      requestedAt: collegeRequests.requestedAt,
      reviewedAt: collegeRequests.reviewedAt,
    })
    .from(collegeRequests)
    .where(eq(collegeRequests.id, id))
    .limit(1);

  if (!request) throw errors.notFound('College request');
  return request;
}
