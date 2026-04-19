import { pgTable, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

export const colleges = pgTable('colleges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain').notNull().unique(),     // 'projects.a.localhost' — used by resolveTenant
  emailDomain: text('email_domain').notNull(),   // '@a.ac.in'
  apiKey: text('api_key').notNull().unique(),    // 'cc_live_<32hex>'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type College = typeof colleges.$inferSelect;
export type NewCollege = typeof colleges.$inferInsert;
