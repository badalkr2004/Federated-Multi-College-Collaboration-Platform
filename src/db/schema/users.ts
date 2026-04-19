import { pgTable, text, timestamp, uuid, integer, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  skills: text('skills').array().notNull().default([]),
  bio: text('bio'),
  reputation: integer('reputation').notNull().default(0),
  projectsCompleted: integer('projects_completed').notNull().default(0),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }).default('0.00'),
  collegeId: uuid('college_id').notNull(),
  collegeSlug: text('college_slug').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
