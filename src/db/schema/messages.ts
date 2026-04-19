import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  senderId: uuid('sender_id').notNull(),
  senderCollegeId: uuid('sender_college_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
