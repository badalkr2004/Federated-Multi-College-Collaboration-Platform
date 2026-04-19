import * as argon2 from 'argon2';
import { db } from '../../db/client.js';
import { users } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { errors } from '../../lib/errors.js';
import { signToken } from '../../lib/jwt.js';
import type { College } from '../../db/schema/index.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    collegeId: string;
    collegeSlug: string;
    role: string;
  };
}

export async function register(input: RegisterInput, tenant: College): Promise<AuthResult> {
  // Check existing email within this college
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) throw errors.conflict('Email already registered');

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash,
      collegeId: tenant.id,
      role: 'user',
    })
    .returning();

  const token = signToken({
    userId: user!.id,
    collegeId: tenant.id,
    collegeSlug: tenant.slug,
    email: user!.email,
    role: 'user',
  });

  return {
    token,
    user: {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      collegeId: tenant.id,
      collegeSlug: tenant.slug,
      role: 'user',
    },
  };
}

export async function login(input: LoginInput, tenant: College): Promise<AuthResult> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, input.email), eq(users.collegeId, tenant.id)))
    .limit(1);

  if (!user) throw errors.unauthorized('Invalid credentials');

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) throw errors.unauthorized('Invalid credentials');

  const token = signToken({
    userId: user.id,
    collegeId: tenant.id,
    collegeSlug: tenant.slug,
    email: user.email,
    role: user.role as 'user',
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      collegeId: tenant.id,
      collegeSlug: tenant.slug,
      role: user.role,
    },
  };
}

export async function getMe(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      skills: users.skills,
      bio: users.bio,
      role: users.role,
      reputation: users.reputation,
      avgRating: users.avgRating,
      projectsCompleted: users.projectsCompleted,
      collegeId: users.collegeId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw errors.notFound('User');
  return user;
}
