import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'prefer' });

async function clean(): Promise<void> {
  console.log('🧹 Dropping all tables for clean v2 migration...');

  // v1 tables
  await sql`DROP TABLE IF EXISTS "account" CASCADE`;
  await sql`DROP TABLE IF EXISTS "session" CASCADE`;
  await sql`DROP TABLE IF EXISTS "verification" CASCADE`;
  await sql`DROP TABLE IF EXISTS "user" CASCADE`;
  // v1 + v2 tables
  await sql`DROP TABLE IF EXISTS "messages" CASCADE`;
  await sql`DROP TABLE IF EXISTS "ratings" CASCADE`;
  await sql`DROP TABLE IF EXISTS "team_members" CASCADE`;
  await sql`DROP TABLE IF EXISTS "projects" CASCADE`;
  await sql`DROP TABLE IF EXISTS "users" CASCADE`;
  await sql`DROP TABLE IF EXISTS "college_requests" CASCADE`;
  await sql`DROP TABLE IF EXISTS "colleges" CASCADE`;

  console.log('✅ All tables dropped. Run db:push next.');
  await sql.end();
  process.exit(0);
}

clean().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
