import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users } from '../../db/schema/index.js';
import { errors } from '../../lib/errors.js';
import { cacheDel } from '../../lib/redis.js';
import type { UpdateProfileInput, UpdateSkillsInput } from './users.schema.js';
import type { UserPublic } from './users.types.js';

function toPublic(user: typeof users.$inferSelect): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio ?? null,
    skills: user.skills,
    reputation: user.reputation,
    projectsCompleted: user.projectsCompleted,
    avgRating: user.avgRating ?? null,
    collegeId: user.collegeId,
    collegeSlug: user.collegeSlug,
  };
}

export async function getMe(userId: string): Promise<UserPublic> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw errors.notFound('User');
  return toPublic(user);
}

export async function getUserById(userId: string, requestingCollegeId: string): Promise<UserPublic> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw errors.notFound('User');

  // If users are from different colleges, only expose public info (already handled by toPublic)
  return toPublic(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserPublic> {
  const [user] = await db
    .update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  if (!user) throw errors.notFound('User');
  return toPublic(user);
}

export async function updateSkills(
  userId: string,
  input: UpdateSkillsInput,
): Promise<UserPublic> {
  const [user] = await db
    .update(users)
    .set({ skills: input.skills, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  if (!user) throw errors.notFound('User');

  // Invalidate matchmaking cache for this user
  await cacheDel(`match:projects:${userId}`);

  return toPublic(user);
}
