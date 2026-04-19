import { sql } from "drizzle-orm";
import { db, pool } from ".";

async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT 1`);
    console.log("Connection successful:", result);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await pool.end(); // Close connection
  }
}

testConnection();
