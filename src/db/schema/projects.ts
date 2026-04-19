import { pgTable, text, timestamp, uuid, integer, boolean } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  requiredSkills: text('required_skills').array().notNull().default([]),
  status: text('status', { enum: ['open', 'in_progress', 'completed', 'cancelled'] })
    .notNull()
    .default('open'),
  crossCollege: boolean('cross_college').notNull().default(false),
  ownerId: uuid('owner_id').notNull(),
  ownerCollegeId: uuid('owner_college_id').notNull(), // which college created it
  collegeId: uuid('college_id').notNull(),             // same as ownerCollegeId; used for consistent filtering
  maxMembers: integer('max_members').notNull().default(5),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  userId: uuid('user_id').notNull(),
  userCollegeId: uuid('user_college_id').notNull(),
  role: text('role', { enum: ['owner', 'member'] }).notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
