import { eq, and, avg, count } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { ratings, users, teamMembers } from '../../db/schema/index.js';
import { errors } from '../../lib/errors.js';
import type { RateInput } from './reputation.schema.js';
import type { RatingPublic } from './reputation.types.js';

function calculateReputation(avgRating: number, projectsCompleted: number): number {
  // avgRating (0-5) → normalised to 0-100 by × 20
  // Each completed project adds 2 points
  return Math.round(avgRating * 0.6 * 20 + projectsCompleted * 2);
}

export async function rateUser(
  projectId: string,
  raterId: string,
  input: RateInput,
): Promise<RatingPublic> {
  // Cannot rate yourself
  if (raterId === input.ratedUserId) {
    throw errors.badRequest('Cannot rate yourself');
  }

  // Both parties must be project members
  const [raterMember] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, raterId)))
    .limit(1);

  if (!raterMember) throw errors.forbidden('You are not a member of this project');

  const [ratedMember] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, input.ratedUserId)))
    .limit(1);

  if (!ratedMember) throw errors.badRequest('Rated user is not a member of this project');

  // Prevent duplicate rating
  const [existing] = await db
    .select()
    .from(ratings)
    .where(
      and(
        eq(ratings.projectId, projectId),
        eq(ratings.raterId, raterId),
        eq(ratings.ratedUserId, input.ratedUserId),
      ),
    )
    .limit(1);

  if (existing) throw errors.conflict('You have already rated this user for this project');

  const [rating] = await db
    .insert(ratings)
    .values({
      projectId,
      raterId,
      ratedUserId: input.ratedUserId,
      score: input.score,
      comment: input.comment,
    })
    .returning();

  if (!rating) throw errors.internal('Failed to create rating');

  // Recalculate reputation for rated user synchronously
  const [aggResult] = await db
    .select({
      avgScore: avg(ratings.score),
      totalRatings: count(ratings.id),
    })
    .from(ratings)
    .where(eq(ratings.ratedUserId, input.ratedUserId));

  const [ratedUser] = await db
    .select({ projectsCompleted: users.projectsCompleted })
    .from(users)
    .where(eq(users.id, input.ratedUserId))
    .limit(1);

  if (aggResult && ratedUser) {
    const newReputation = calculateReputation(
      parseFloat(aggResult.avgScore ?? '0'),
      ratedUser.projectsCompleted,
    );

    await db
      .update(users)
      .set({
        reputation: newReputation,
        avgRating: (aggResult.avgScore ?? '0.00').toString().substring(0, 4),
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.ratedUserId));
  }

  return {
    id: rating.id,
    projectId: rating.projectId,
    raterId: rating.raterId,
    ratedUserId: rating.ratedUserId,
    score: rating.score,
    comment: rating.comment ?? null,
    createdAt: rating.createdAt,
  };
}

export async function getUserRatings(userId: string): Promise<RatingPublic[]> {
  const rows = await db
    .select()
    .from(ratings)
    .where(eq(ratings.ratedUserId, userId))
    .orderBy(ratings.createdAt);

  return rows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    raterId: r.raterId,
    ratedUserId: r.ratedUserId,
    score: r.score,
    comment: r.comment ?? null,
    createdAt: r.createdAt,
  }));
}
