import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const collegeRequests = pgTable('college_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  domain: text('domain').notNull(),              // NOT unique — rejected requests can reapply
  emailDomain: text('email_domain').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull()
    .default('pending'),
  rejectionReason: text('rejection_reason'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by'),               // super_admin user id
});

export type CollegeRequest = typeof collegeRequests.$inferSelect;
export type NewCollegeRequest = typeof collegeRequests.$inferInsert;
