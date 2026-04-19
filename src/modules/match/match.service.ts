import { redis } from '../../lib/redis.js';
import { db } from '../../db/client.js';
import { users, projects } from '../../db/schema/index.js';
import { eq, and, or } from 'drizzle-orm';
import { errors } from '../../lib/errors.js';
import { CONSTANTS } from '../../config/constants.js';

function jaccardSimilarity(setA: string[], setB: string[]): number {
  const a = new Set(setA.map((s) => s.toLowerCase()));
  const b = new Set(setB.map((s) => s.toLowerCase()));
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function compositeScore(skillScore: number, reputation: number): number {
  const normalizedRep = Math.min(reputation / 100, 1);
  return skillScore * 0.7 + normalizedRep * 0.3;
}

export async function matchProjectsForUser(userId: string, collegeId: string) {
  const cacheKey = `match:projects:${userId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {/* fallback */}

  const [user] = await db.select({ skills: users.skills }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw errors.notFound('User');

  const visibleProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.status, 'open'), or(eq(projects.collegeId, collegeId), eq(projects.crossCollege, true))));

  const ranked = visibleProjects
    .map((p) => ({
      projectId: p.id,
      title: p.title,
      description: p.description,
      requiredSkills: p.requiredSkills,
      crossCollege: p.crossCollege,
      score: compositeScore(jaccardSimilarity(user.skills, p.requiredSkills), 0),
      skillOverlap: jaccardSimilarity(user.skills, p.requiredSkills),
    }))
    .filter((p) => p.skillOverlap > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, CONSTANTS.MATCH_TOP_N);

  try { await redis.setex(cacheKey, CONSTANTS.MATCH_CACHE_TTL, JSON.stringify(ranked)); } catch {/* fallback */}
  return ranked;
}

export async function matchUsersForProject(projectId: string, requestingCollegeId: string) {
  const cacheKey = `match:users:${projectId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {/* fallback */}

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw errors.notFound('Project');

  if (!project.crossCollege && project.collegeId !== requestingCollegeId) {
    throw errors.forbidden();
  }

  const candidates = await db
    .select()
    .from(users)
    .where(
      project.crossCollege
        ? eq(users.role, 'user')
        : eq(users.collegeId, requestingCollegeId),
    );

  const ranked = candidates
    .map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      skills: u.skills,
      reputation: u.reputation,
      collegeId: u.collegeId,
      skillOverlap: jaccardSimilarity(u.skills, project.requiredSkills),
      score: compositeScore(jaccardSimilarity(u.skills, project.requiredSkills), u.reputation),
    }))
    .filter((u) => u.skillOverlap > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, CONSTANTS.MATCH_TOP_N);

  try { await redis.setex(cacheKey, CONSTANTS.MATCH_CACHE_TTL, JSON.stringify(ranked)); } catch {/* fallback */}
  return ranked;
}

export async function invalidateUserMatchCache(userId: string): Promise<void> {
  try { await redis.del(`match:projects:${userId}`); } catch {/* fallback */}
}

export async function invalidateProjectMatchCache(projectId: string): Promise<void> {
  try { await redis.del(`match:users:${projectId}`); } catch {/* fallback */}
}
