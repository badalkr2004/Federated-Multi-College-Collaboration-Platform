import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const colleges = pgTable('colleges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  apiKey: text('api_key').notNull().unique(),
  emailDomain: text('email_domain').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type College = typeof colleges.$inferSelect;
export type NewCollege = typeof colleges.$inferInsert;
