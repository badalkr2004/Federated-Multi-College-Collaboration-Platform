import 'dotenv/config';
import * as argon2 from 'argon2';
import { db } from './client.js';
import { colleges, users, projects, teamMembers } from './schema/index.js';
import { eq } from 'drizzle-orm';

async function seed(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ── Colleges ──────────────────────────────────────────────────────────────
  const [collegeA] = await db
    .insert(colleges)
    .values({ name: 'College A', slug: 'college_a', apiKey: 'key-college-a', emailDomain: '@collegea.edu' })
    .onConflictDoUpdate({ target: colleges.slug, set: { name: 'College A' } })
    .returning();

  const [collegeB] = await db
    .insert(colleges)
    .values({ name: 'College B', slug: 'college_b', apiKey: 'key-college-b', emailDomain: '@collegeb.edu' })
    .onConflictDoUpdate({ target: colleges.slug, set: { name: 'College B' } })
    .returning();

  if (!collegeA || !collegeB) throw new Error('Failed to seed colleges');
  console.log(`  ✓ Colleges: ${collegeA.slug}, ${collegeB.slug}`);

  const pw = await argon2.hash('Pass1234!', { type: argon2.argon2id });

  // ── College A Users ───────────────────────────────────────────────────────
  const [alice] = await db
    .insert(users)
    .values({
      name: 'Alice',
      email: 'alice@collegea.edu',
      passwordHash: pw,
      skills: ['React', 'TypeScript', 'Node.js'],
      reputation: 45,
      collegeId: collegeA.id,
      collegeSlug: collegeA.slug,
    })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Alice' } })
    .returning();

  const [bob] = await db
    .insert(users)
    .values({
      name: 'Bob',
      email: 'bob@collegea.edu',
      passwordHash: pw,
      skills: ['Python', 'ML', 'Data Science'],
      reputation: 72,
      collegeId: collegeA.id,
      collegeSlug: collegeA.slug,
    })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Bob' } })
    .returning();

  const [carol] = await db
    .insert(users)
    .values({
      name: 'Carol',
      email: 'carol@collegea.edu',
      passwordHash: pw,
      skills: ['UI/UX', 'Figma', 'React'],
      reputation: 30,
      collegeId: collegeA.id,
      collegeSlug: collegeA.slug,
    })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Carol' } })
    .returning();

  // ── College B Users ───────────────────────────────────────────────────────
  const [dave] = await db
    .insert(users)
    .values({
      name: 'Dave',
      email: 'dave@collegeb.edu',
      passwordHash: pw,
      skills: ['Python', 'ML', 'FastAPI'],
      reputation: 88,
      collegeId: collegeB.id,
      collegeSlug: collegeB.slug,
    })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Dave' } })
    .returning();

  const [eve] = await db
    .insert(users)
    .values({
      name: 'Eve',
      email: 'eve@collegeb.edu',
      passwordHash: pw,
      skills: ['DevOps', 'Docker', 'Kubernetes'],
      reputation: 55,
      collegeId: collegeB.id,
      collegeSlug: collegeB.slug,
    })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Eve' } })
    .returning();

  const [frank] = await db
    .insert(users)
    .values({
      name: 'Frank',
      email: 'frank@collegeb.edu',
      passwordHash: pw,
      skills: ['Node.js', 'PostgreSQL', 'Redis'],
      reputation: 40,
      collegeId: collegeB.id,
      collegeSlug: collegeB.slug,
    })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Frank' } })
    .returning();

  if (!alice || !bob || !carol || !dave || !eve || !frank) throw new Error('Failed to seed users');
  console.log(`  ✓ Users: Alice, Bob, Carol (College A) | Dave, Eve, Frank (College B)`);

  // ── Projects ──────────────────────────────────────────────────────────────
  // Clean up team_members for existing projects to re-seed cleanly
  const existingProjects = await db
    .select({ id: projects.id, ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.ownerId, bob.id));

  if (existingProjects.length === 0) {
    // AI Study Assistant (cross-college, owner: Bob)
    const [aiProject] = await db
      .insert(projects)
      .values({
        title: 'AI Study Assistant',
        description: 'A smart assistant that helps students study using ML and interactive UI.',
        requiredSkills: ['Python', 'ML', 'React'],
        crossCollege: true,
        ownerId: bob.id,
        ownerCollegeId: collegeA.id,
        maxMembers: 5,
      })
      .returning();

    if (aiProject) {
      await db.insert(teamMembers).values({
        projectId: aiProject.id,
        userId: bob.id,
        userCollegeId: collegeA.id,
        role: 'owner',
      });
      console.log(`  ✓ Project: AI Study Assistant (cross-college, owner: Bob)`);
    }
  }

  const campusProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.ownerId, alice.id));

  if (campusProjects.length === 0) {
    // Campus Event App (College A only, owner: Alice)
    const [campusProject] = await db
      .insert(projects)
      .values({
        title: 'Campus Event App',
        description: 'Mobile app to discover and manage campus events with real-time updates.',
        requiredSkills: ['React', 'Node.js'],
        crossCollege: false,
        ownerId: alice.id,
        ownerCollegeId: collegeA.id,
        maxMembers: 4,
      })
      .returning();

    if (campusProject) {
      await db.insert(teamMembers).values({
        projectId: campusProject.id,
        userId: alice.id,
        userCollegeId: collegeA.id,
        role: 'owner',
      });
      console.log(`  ✓ Project: Campus Event App (College A, owner: Alice)`);
    }
  }

  const devOpsProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.ownerId, eve.id));

  if (devOpsProjects.length === 0) {
    // DevOps Pipeline Builder (cross-college, owner: Eve)
    const [devOpsProject] = await db
      .insert(projects)
      .values({
        title: 'DevOps Pipeline Builder',
        description: 'Automated CI/CD pipeline builder with Docker and Kubernetes support.',
        requiredSkills: ['Docker', 'Kubernetes', 'CI/CD'],
        crossCollege: true,
        ownerId: eve.id,
        ownerCollegeId: collegeB.id,
        maxMembers: 5,
      })
      .returning();

    if (devOpsProject) {
      await db.insert(teamMembers).values({
        projectId: devOpsProject.id,
        userId: eve.id,
        userCollegeId: collegeB.id,
        role: 'owner',
      });
      console.log(`  ✓ Project: DevOps Pipeline Builder (cross-college, owner: Eve)`);
    }
  }

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Demo credentials (all passwords: Pass1234!):');
  console.log('   College A API key: key-college-a');
  console.log('   College B API key: key-college-b');
  console.log('   alice@collegea.edu | bob@collegea.edu | carol@collegea.edu');
  console.log('   dave@collegeb.edu  | eve@collegeb.edu  | frank@collegeb.edu');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
