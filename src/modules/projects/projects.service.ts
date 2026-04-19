import { db } from '../../db/client.js';
import { projects, teamMembers } from '../../db/schema/index.js';
import { eq, and, or } from 'drizzle-orm';
import { errors } from '../../lib/errors.js';
import type { CreateProjectInput, UpdateProjectInput } from './projects.schema.js';

export async function createProject(input: CreateProjectInput, userId: string, collegeId: string) {
  const [project] = await db
    .insert(projects)
    .values({
      ...input,
      ownerId: userId,
      ownerCollegeId: collegeId,
      collegeId: collegeId, // consistent filter column
    })
    .returning();

  // Add owner as team member
  await db.insert(teamMembers).values({
    projectId: project!.id,
    userId,
    userCollegeId: collegeId,
    role: 'owner',
  });

  return project!;
}

export async function listProjects(collegeId: string, status?: string, skill?: string) {
  // Own college + all cross-college projects
  let query = db
    .select()
    .from(projects)
    .where(or(eq(projects.collegeId, collegeId), eq(projects.crossCollege, true)));

  const results = await query;

  return results.filter((p) => {
    if (status && p.status !== status) return false;
    if (skill && !p.requiredSkills.some((s) => s.toLowerCase().includes(skill.toLowerCase()))) return false;
    return true;
  });
}

export async function getProject(projectId: string, collegeId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw errors.notFound('Project');

  // Access check: own college or cross-college
  if (!project.crossCollege && project.collegeId !== collegeId) {
    throw errors.forbidden();
  }

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.projectId, projectId));

  return { ...project, members };
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  userId: string,
  collegeId: string,
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.collegeId, collegeId)))
    .limit(1);

  if (!project) throw errors.notFound('Project');
  if (project.ownerId !== userId) throw errors.forbidden('Only the project owner can update it');

  const [updated] = await db
    .update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning();

  return updated!;
}

export async function joinProject(projectId: string, userId: string, userCollegeId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw errors.notFound('Project');
  if (project.status !== 'open') throw errors.badRequest('This project is not accepting members');

  // Cross-college check: if not cross-college, must be same college
  if (!project.crossCollege && project.collegeId !== userCollegeId) {
    throw errors.forbidden('This project is not open for cross-college collaboration');
  }

  // Membership check
  const [existing] = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (existing) throw errors.conflict('Already a member of this project');

  // Max members check
  const currentMembers = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(eq(teamMembers.projectId, projectId));

  if (currentMembers.length >= project.maxMembers) {
    throw errors.conflict('Project team is full');
  }

  await db.insert(teamMembers).values({ projectId, userId, userCollegeId, role: 'member' });
  return { message: 'Joined project successfully' };
}

export async function leaveProject(projectId: string, userId: string) {
  const [member] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!member) throw errors.notFound('Team membership');
  if (member.role === 'owner') throw errors.badRequest('Project owner cannot leave — transfer ownership or delete the project');

  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, userId)));

  return { message: 'Left project successfully' };
}
