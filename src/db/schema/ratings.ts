import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  raterId: uuid('rater_id').notNull(),
  ratedUserId: uuid('rated_user_id').notNull(),
  score: integer('score').notNull(), // 1-5
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Rating = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;
