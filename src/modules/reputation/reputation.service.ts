import { db } from '../../db/client.js';
import { ratings, users, teamMembers } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { errors } from '../../lib/errors.js';
import { invalidateProjectMatchCache } from '../match/match.service.js';

export async function submitRating(
  raterId: string,
  raterCollegeId: string,
  projectId: string,
  ratedUserId: string,
  score: number,
  comment?: string,
): Promise<void> {
  if (raterId === ratedUserId) throw errors.badRequest('Cannot rate yourself');

  // Both must be project members
  const [raterMembership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, raterId)))
    .limit(1);

  const [ratedMembership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, ratedUserId)))
    .limit(1);

  if (!raterMembership) throw errors.forbidden('You are not a member of this project');
  if (!ratedMembership) throw errors.badRequest('Rated user is not a member of this project');

  // No duplicate ratings
  const [existing] = await db
    .select({ id: ratings.id })
    .from(ratings)
    .where(
      and(
        eq(ratings.projectId, projectId),
        eq(ratings.raterId, raterId),
        eq(ratings.ratedUserId, ratedUserId),
      ),
    )
    .limit(1);

  if (existing) throw errors.conflict('You have already rated this user for this project');

  const [ratedUser] = await db
    .select({ collegeId: users.collegeId })
    .from(users)
    .where(eq(users.id, ratedUserId))
    .limit(1);

  await db.insert(ratings).values({
    projectId,
    raterId,
    raterCollegeId,
    ratedUserId,
    ratedUserCollegeId: ratedUser?.collegeId ?? raterCollegeId,
    score,
    comment,
  });

  await recalculateReputation(ratedUserId);
  await invalidateProjectMatchCache(projectId);
}

export async function recalculateReputation(userId: string): Promise<void> {
  const userRatings = await db
    .select({ score: ratings.score })
    .from(ratings)
    .where(eq(ratings.ratedUserId, userId));

  const [user] = await db
    .select({ projectsCompleted: users.projectsCompleted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const avgScore =
    userRatings.length > 0
      ? userRatings.reduce((sum, r) => sum + r.score, 0) / userRatings.length
      : 0;

  // Formula: avgRating (0-5 → 0-60) + projectsCompleted × 2
  const reputation = Math.round((avgScore / 5) * 60) + ((user?.projectsCompleted ?? 0) * 2);

  await db
    .update(users)
    .set({ reputation, avgRating: avgScore.toFixed(2), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getUserRatings(userId: string) {
  return db.select().from(ratings).where(eq(ratings.ratedUserId, userId)).orderBy(ratings.createdAt);
}
