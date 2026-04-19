import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { messages, teamMembers, projects } from '../../db/schema/index.js';
import { errors } from '../../lib/errors.js';
import { CONSTANTS } from '../../config/constants.js';
import type { SendMessageInput } from './messages.schema.js';
import type { MessagePublic } from './messages.types.js';

async function assertMember(projectId: string, userId: string, collegeId: string): Promise<void> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw errors.notFound('Project');

  // Cross-college projects open to all; private projects need membership
  if (!project.crossCollege && project.ownerCollegeId !== collegeId) {
    throw errors.forbidden('This is a private project');
  }

  const [member] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.projectId, projectId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!member) throw errors.forbidden('You must be a project member to message');
}

export async function sendMessage(
  projectId: string,
  senderId: string,
  senderCollegeId: string,
  input: SendMessageInput,
): Promise<MessagePublic> {
  await assertMember(projectId, senderId, senderCollegeId);

  const [message] = await db
    .insert(messages)
    .values({
      projectId,
      senderId,
      senderCollegeId,
      content: input.content,
    })
    .returning();

  if (!message) throw errors.internal('Failed to send message');

  return {
    id: message.id,
    projectId: message.projectId,
    senderId: message.senderId,
    senderCollegeId: message.senderCollegeId,
    content: message.content,
    createdAt: message.createdAt,
  };
}

export async function getMessages(
  projectId: string,
  userId: string,
  collegeId: string,
  page = CONSTANTS.DEFAULT_PAGE,
  limit = 50,
): Promise<{ messages: MessagePublic[]; total: number }> {
  await assertMember(projectId, userId, collegeId);

  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(messages)
      .where(eq(messages.projectId, projectId)),
  ]);

  return {
    messages: rows.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      senderId: m.senderId,
      senderCollegeId: m.senderCollegeId,
      content: m.content,
      createdAt: m.createdAt,
    })),
    total: Number(total),
  };
}
