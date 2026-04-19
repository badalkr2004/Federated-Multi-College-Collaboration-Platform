import 'dotenv/config';
import * as argon2 from 'argon2';
import { db } from './client.js';
import { colleges, users, projects, teamMembers } from './schema/index.js';
import { env } from '../config/env.js';
import { eq } from 'drizzle-orm';

const DEMO_PASSWORD = 'Pass1234!';

async function seed(): Promise<void> {
  console.log('🌱 Seeding database...');

  const pw = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  // ── Super Admin ────────────────────────────────────────────────────────────
  const adminPw = await argon2.hash(env.SUPER_ADMIN_PASSWORD, { type: argon2.argon2id });
  await db
    .insert(users)
    .values({
      name: 'Platform Admin',
      email: env.SUPER_ADMIN_EMAIL,
      passwordHash: adminPw,
      role: 'super_admin',
      collegeId: null,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: 'Platform Admin', role: 'super_admin' },
    });
  console.log(`  ✓ Super admin: ${env.SUPER_ADMIN_EMAIL} (password: ${env.SUPER_ADMIN_PASSWORD})`);

  // ── Colleges ──────────────────────────────────────────────────────────────
  const domainA = `projects.a.${env.DOMAIN_SUFFIX}`;
  const domainB = `projects.b.${env.DOMAIN_SUFFIX}`;
  const apiKeyA = 'cc_live_collegea000000000000000000000000000';
  const apiKeyB = 'cc_live_collegeb000000000000000000000000000';

  const [collegeA] = await db
    .insert(colleges)
    .values({ name: 'College A', slug: 'college_a', domain: domainA, emailDomain: '@a.ac.in', apiKey: apiKeyA })
    .onConflictDoUpdate({ target: colleges.slug, set: { domain: domainA } })
    .returning();

  const [collegeB] = await db
    .insert(colleges)
    .values({ name: 'College B', slug: 'college_b', domain: domainB, emailDomain: '@b.ac.in', apiKey: apiKeyB })
    .onConflictDoUpdate({ target: colleges.slug, set: { domain: domainB } })
    .returning();

  if (!collegeA || !collegeB) throw new Error('Failed to seed colleges');
  console.log(`  ✓ College A: ${domainA} (key: ${apiKeyA})`);
  console.log(`  ✓ College B: ${domainB} (key: ${apiKeyB})`);

  // ── Users — College A ─────────────────────────────────────────────────────
  const [alice] = await db
    .insert(users)
    .values({ name: 'Alice', email: 'alice@a.ac.in', passwordHash: pw, skills: ['React', 'TypeScript', 'Node.js'], reputation: 45, collegeId: collegeA.id, role: 'user' })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Alice', collegeId: collegeA.id } })
    .returning();

  const [bob] = await db
    .insert(users)
    .values({ name: 'Bob', email: 'bob@a.ac.in', passwordHash: pw, skills: ['Python', 'ML', 'Data Science'], reputation: 72, collegeId: collegeA.id, role: 'user' })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Bob', collegeId: collegeA.id } })
    .returning();

  await db
    .insert(users)
    .values({ name: 'Carol', email: 'carol@a.ac.in', passwordHash: pw, skills: ['UI/UX', 'Figma', 'React'], reputation: 30, collegeId: collegeA.id, role: 'user' })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Carol', collegeId: collegeA.id } });

  // ── Users — College B ─────────────────────────────────────────────────────
  const [dave] = await db
    .insert(users)
    .values({ name: 'Dave', email: 'dave@b.ac.in', passwordHash: pw, skills: ['Python', 'ML', 'FastAPI'], reputation: 88, collegeId: collegeB.id, role: 'user' })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Dave', collegeId: collegeB.id } })
    .returning();

  const [eve] = await db
    .insert(users)
    .values({ name: 'Eve', email: 'eve@b.ac.in', passwordHash: pw, skills: ['DevOps', 'Docker', 'Kubernetes'], reputation: 55, collegeId: collegeB.id, role: 'user' })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Eve', collegeId: collegeB.id } })
    .returning();

  await db
    .insert(users)
    .values({ name: 'Frank', email: 'frank@b.ac.in', passwordHash: pw, skills: ['Node.js', 'PostgreSQL', 'Redis'], reputation: 40, collegeId: collegeB.id, role: 'user' })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Frank', collegeId: collegeB.id } });

  console.log('  ✓ Users: Alice, Bob, Carol (A) | Dave, Eve, Frank (B)');

  // ── Projects ──────────────────────────────────────────────────────────────
  const existingAI = await db.select({ id: projects.id }).from(projects).where(eq(projects.ownerId, bob!.id)).limit(1);
  if (!existingAI[0] && bob) {
    const [aiProj] = await db.insert(projects).values({
      title: 'AI Study Assistant', description: 'A smart assistant using ML and interactive UI.',
      requiredSkills: ['Python', 'ML', 'React'], crossCollege: true,
      ownerId: bob.id, ownerCollegeId: collegeA.id, collegeId: collegeA.id, maxMembers: 5,
    }).returning();
    if (aiProj) await db.insert(teamMembers).values({ projectId: aiProj.id, userId: bob.id, userCollegeId: collegeA.id, role: 'owner' });
    console.log('  ✓ Project: AI Study Assistant (cross-college, Bob)');
  }

  const existingCampus = await db.select({ id: projects.id }).from(projects).where(eq(projects.ownerId, alice!.id)).limit(1);
  if (!existingCampus[0] && alice) {
    const [campusProj] = await db.insert(projects).values({
      title: 'Campus Event App', description: 'Mobile app for campus events.',
      requiredSkills: ['React', 'Node.js'], crossCollege: false,
      ownerId: alice.id, ownerCollegeId: collegeA.id, collegeId: collegeA.id, maxMembers: 4,
    }).returning();
    if (campusProj) await db.insert(teamMembers).values({ projectId: campusProj.id, userId: alice.id, userCollegeId: collegeA.id, role: 'owner' });
    console.log('  ✓ Project: Campus Event App (College A only, Alice)');
  }

  const existingDevOps = await db.select({ id: projects.id }).from(projects).where(eq(projects.ownerId, eve!.id)).limit(1);
  if (!existingDevOps[0] && eve) {
    const [devProj] = await db.insert(projects).values({
      title: 'DevOps Pipeline Builder', description: 'Automated CI/CD with Docker and Kubernetes.',
      requiredSkills: ['Docker', 'Kubernetes', 'CI/CD'], crossCollege: true,
      ownerId: eve.id, ownerCollegeId: collegeB.id, collegeId: collegeB.id, maxMembers: 5,
    }).returning();
    if (devProj) await db.insert(teamMembers).values({ projectId: devProj.id, userId: eve.id, userCollegeId: collegeB.id, role: 'owner' });
    console.log('  ✓ Project: DevOps Pipeline Builder (cross-college, Eve)');
  }

  console.log('\n✅ Seed complete!\n');
  console.log('📋 Demo credentials:');
  console.log(`   Super Admin: ${env.SUPER_ADMIN_EMAIL} / ${env.SUPER_ADMIN_PASSWORD}`);
  console.log(`   College A (Host: ${domainA}, Key: ${apiKeyA})`);
  console.log('   alice@a.ac.in | bob@a.ac.in | carol@a.ac.in  (Pass1234!)');
  console.log(`   College B (Host: ${domainB}, Key: ${apiKeyB})`);
  console.log('   dave@b.ac.in  | eve@b.ac.in  | frank@b.ac.in (Pass1234!)');
  console.log('\n⚠️  Add to C:\\Windows\\System32\\drivers\\etc\\hosts:');
  console.log(`   127.0.0.1   ${domainA}`);
  console.log(`   127.0.0.1   ${domainB}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
