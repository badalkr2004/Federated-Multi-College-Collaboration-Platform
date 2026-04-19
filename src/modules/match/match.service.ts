import { eq, ne } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users, projects } from '../../db/schema/index.js';
import { cacheGet, cacheSet } from '../../lib/redis.js';
import { errors } from '../../lib/errors.js';
import { CONSTANTS } from '../../config/constants.js';
import type { MatchedProject, MatchedUser } from './match.types.js';

// Jaccard similarity on skill sets
function jaccardSimilarity(setA: string[], setB: string[]): number {
  const a = new Set(setA.map((s) => s.toLowerCase()));
  const b = new Set(setB.map((s) => s.toLowerCase()));
  const intersection = [...a].filter((s) => b.has(s)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

// Weighted rank: 70% skill match + 30% normalised reputation
function rankScore(skillScore: number, reputation: number): number {
  const normRep = Math.min(reputation / 100, 1);
  return skillScore * 0.7 + normRep * 0.3;
}

// Top-N projects ranked for a given user
export async function matchProjectsForUser(userId: string): Promise<MatchedProject[]> {
  const cacheKey = `match:projects:${userId}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached) as MatchedProject[];

  // Get user skills
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw errors.notFound('User');

  // Get open projects not owned by this user
  const allProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.status, 'open'));

  const scored: MatchedProject[] = allProjects
    .filter((p) => p.ownerId !== userId)
    .map((p) => {
      const skillScore = jaccardSimilarity(user.skills, p.requiredSkills);
      return {
        projectId: p.id,
        title: p.title,
        description: p.description,
        requiredSkills: p.requiredSkills,
        ownerCollegeId: p.ownerCollegeId,
        crossCollege: p.crossCollege,
        score: rankScore(skillScore, user.reputation),
        skillOverlap: skillScore,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, CONSTANTS.MATCH_TOP_N);

  await cacheSet(cacheKey, JSON.stringify(scored), CONSTANTS.MATCH_CACHE_TTL);
  return scored;
}

// Top-N users ranked for a given project
export async function matchUsersForProject(
  projectId: string,
  requestingCollegeId: string,
): Promise<MatchedUser[]> {
  const cacheKey = `match:users:${projectId}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached) as MatchedUser[];

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw errors.notFound('Project');

  // Access control
  if (project.ownerCollegeId !== requestingCollegeId && !project.crossCollege) {
    throw errors.forbidden();
  }

  // Get all users not already owner
  const allUsers = await db
    .select()
    .from(users)
    .where(ne(users.id, project.ownerId));

  const scored: MatchedUser[] = allUsers
    .map((u) => {
      const skillScore = jaccardSimilarity(u.skills, project.requiredSkills);
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        skills: u.skills,
        reputation: u.reputation,
        collegeSlug: u.collegeSlug,
        score: rankScore(skillScore, u.reputation),
        skillOverlap: skillScore,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, CONSTANTS.MATCH_TOP_N);

  await cacheSet(cacheKey, JSON.stringify(scored), CONSTANTS.MATCH_CACHE_TTL);
  return scored;
}
