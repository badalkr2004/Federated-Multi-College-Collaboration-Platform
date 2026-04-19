import { db } from '../db';
import { sessions } from '../db/schema';
import { eq, lt, gt, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { generateRefreshToken, getRefreshTokenExpiry, verifyRefreshToken } from './jwt';
import { Request } from 'express';

export interface SessionData {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}

// Create new session with refresh token
export async function createSession(
  userId: string,
  req: Request
): Promise<SessionData> {
  const sessionId = uuidv4();
  const refreshToken = generateRefreshToken(userId, sessionId);
  const expiresAt = getRefreshTokenExpiry();
  
  const userAgent = req.headers['user-agent'] || null;
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return {
    id: sessionId,
    userId,
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  };
}

// Find session by refresh token
export async function findSessionByToken(refreshToken: string): Promise<SessionData | null> {
  const result = await db.query.sessions.findFirst({
    where: eq(sessions.refreshToken, refreshToken),
  });

  if (!result) return null;

  return {
    id: result.id,
    userId: result.userId,
    refreshToken: result.refreshToken,
    userAgent: result.userAgent,
    ipAddress: result.ipAddress,
    expiresAt: result.expiresAt,
  };
}

// Rotate refresh token (invalidate old, create new)
export async function rotateRefreshToken(
  oldToken: string,
  req: Request
): Promise<SessionData | null> {
  // Verify the old token
  const payload = verifyRefreshToken(oldToken);
  if (!payload) return null;

  // Find the session
  const session = await findSessionByToken(oldToken);
  if (!session) return null;

  // Check if session is expired
  if (new Date() > session.expiresAt) {
    await deleteSession(session.id);
    return null;
  }

  // Generate new refresh token
  const newRefreshToken = generateRefreshToken(session.userId, session.id);
  const newExpiresAt = getRefreshTokenExpiry();

  // Update session with new token
  await db.update(sessions)
    .set({
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      userAgent: req.headers['user-agent'] || session.userAgent,
      ipAddress: req.ip || req.socket.remoteAddress || session.ipAddress,
    })
    .where(eq(sessions.id, session.id));

  return {
    ...session,
    refreshToken: newRefreshToken,
    expiresAt: newExpiresAt,
  };
}

// Delete session (logout)
export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

// Delete all sessions for a user (logout everywhere)
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .returning({ id: sessions.id });
  
  return result.length;
}

// Get all active sessions for a user
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  const result = await db.query.sessions.findMany({
    where: and(
      eq(sessions.userId, userId),
      gt(sessions.expiresAt, new Date())
    ),
  });

  return result.map(s => ({
    id: s.id,
    userId: s.userId,
    refreshToken: s.refreshToken,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    expiresAt: s.expiresAt,
  }));
}
