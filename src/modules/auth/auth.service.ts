import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { colleges, users } from '../../db/schema/index.js';
import { signToken } from '../../lib/jwt.js';
import { errors } from '../../lib/errors.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import type { RegisterResult, LoginResult } from './auth.types.js';

async function resolveCollege(apiKey: string) {
  const [college] = await db
    .select()
    .from(colleges)
    .where(eq(colleges.apiKey, apiKey))
    .limit(1);

  if (!college) {
    throw errors.badRequest('Invalid college API key');
  }
  return college;
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const college = await resolveCollege(input.collegeApiKey);

  // Check for duplicate email within college
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) {
    throw errors.conflict('Email already registered');
  }

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash,
      collegeId: college.id,
      collegeSlug: college.slug,
    })
    .returning();

  if (!user) throw errors.internal('Failed to create user');

  const token = signToken({
    userId: user.id,
    collegeId: college.id,
    collegeSlug: college.slug,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      collegeId: college.id,
      collegeSlug: college.slug,
    },
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const college = await resolveCollege(input.collegeApiKey);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    throw errors.unauthorized('Invalid email or password');
  }

  // Ensure user belongs to this college
  if (user.collegeId !== college.id) {
    throw errors.unauthorized('Invalid email or password');
  }

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) {
    throw errors.unauthorized('Invalid email or password');
  }

  const token = signToken({
    userId: user.id,
    collegeId: college.id,
    collegeSlug: college.slug,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      collegeId: college.id,
      collegeSlug: college.slug,
    },
  };
}
