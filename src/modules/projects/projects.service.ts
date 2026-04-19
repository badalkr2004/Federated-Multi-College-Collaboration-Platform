import { eq, or, and, count } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { projects, teamMembers } from '../../db/schema/index.js';
import { errors } from '../../lib/errors.js';
import type { CreateProjectInput, UpdateProjectInput } from './projects.schema.js';
import type { ProjectPublic, TeamMemberPublic } from './projects.types.js';

function toPublic(p: typeof projects.$inferSelect): ProjectPublic {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    requiredSkills: p.requiredSkills,
    status: p.status,
    crossCollege: p.crossCollege,
    ownerId: p.ownerId,
    ownerCollegeId: p.ownerCollegeId,
    maxMembers: p.maxMembers,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function createProject(
  input: CreateProjectInput,
  userId: string,
  collegeId: string,
): Promise<ProjectPublic> {
  const [project] = await db
    .insert(projects)
    .values({
      ...input,
      ownerId: userId,
      ownerCollegeId: collegeId,
    })
    .returning();

  if (!project) throw errors.internal('Failed to create project');

  // Add owner as team member
  await db.insert(teamMembers).values({
    projectId: project.id,
    userId,
    userCollegeId: collegeId,
    role: 'owner',
  });

  return toPublic(project);
}

export async function listProjects(collegeId: string): Promise<ProjectPublic[]> {
  // Return projects from this college OR cross-college projects
  const rows = await db
    .select()
    .from(projects)
    .where(or(eq(projects.ownerCollegeId, collegeId), eq(projects.crossCollege, true)))
    .orderBy(projects.createdAt);

  return rows.map(toPublic);
}

export async function getProjectById(projectId: string, collegeId: string): Promise<{
  project: ProjectPublic;
  members: TeamMemberPublic[];
}> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw errors.notFound('Project');

  // Access control: own college project OR cross-college
  if (project.ownerCollegeId !== collegeId && !project.crossCollege) {
    throw errors.forbidden();
  }

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.projectId, projectId));

  return {
    project: toPublic(project),
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      userCollegeId: m.userCollegeId,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  };
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  userId: string,
): Promise<ProjectPublic> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw errors.notFound('Project');
  if (project.ownerId !== userId) throw errors.forbidden('Only project owner can update');

  const [updated] = await db
    .update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning();

  return toPublic(updated!);
}

export async function joinProject(
  projectId: string,
  userId: string,
  collegeId: string,
): Promise<void> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw errors.notFound('Project');
  if (project.status !== 'open') throw errors.badRequest('Project is not open for joining');

  // Cross-college check
  if (project.ownerCollegeId !== collegeId && !project.crossCollege) {
    throw errors.forbidden('This project does not accept cross-college members');
  }

  // Already a member?
  const [existing] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (existing) throw errors.conflict('Already a member of this project');

  // Count current members
  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(teamMembers)
    .where(eq(teamMembers.projectId, projectId));

  if (Number(memberCount) >= project.maxMembers) {
    throw errors.conflict('Project has reached maximum team size');
  }

  await db.insert(teamMembers).values({
    projectId,
    userId,
    userCollegeId: collegeId,
    role: 'member',
  });
}

export async function leaveProject(projectId: string, userId: string): Promise<void> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw errors.notFound('Project');
  if (project.ownerId === userId) throw errors.badRequest('Project owner cannot leave — delete the project instead');

  const [member] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!member) throw errors.notFound('Team membership');

  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, userId)));
}
