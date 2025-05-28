
import { Pool } from '@neondatabase/serverless';
import type { NeonPool } from '@neondatabase/serverless';

let pool: NeonPool | null = null;

export function getDb() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

/**
 * Initializes the database schema if it doesn't exist.
 * IMPORTANT: This function is intended for development convenience.
 * In a production environment, you should use a dedicated database migration tool
 * (e.g., Prisma Migrate, Drizzle Kit, Flyway, Liquibase) to manage your schema
 * and apply changes in a controlled manner.
 * Running this function in production might lead to unintended consequences or data loss.
 * The calls to this function in API routes are guarded by `if (process.env.NODE_ENV === 'development')`.
 */
export async function initializeDbSchema() {
  const db = getDb();
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        is_open BOOLEAN DEFAULT TRUE,
        scheduled_close_time TIMESTAMPTZ,
        vote_limit_enabled BOOLEAN DEFAULT FALSE,
        max_votes_per_client INTEGER DEFAULT 1,
        is_multi_select BOOLEAN DEFAULT FALSE,
        max_selections INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        poll_id TEXT REFERENCES polls(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        avatar_url TEXT,
        data_ai_hint TEXT,
        votes INTEGER DEFAULT 0
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    
    await db.query(`
      INSERT INTO app_settings (key, value) VALUES ('resultsVisibility', 'false') ON CONFLICT (key) DO NOTHING;
    `);
    await db.query(`
      INSERT INTO app_settings (key, value) VALUES ('customTexts', '{}') ON CONFLICT (key) DO NOTHING;
    `);

    console.log("Database schema checked/initialized successfully (for development).");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    // For critical schema errors, you might want to throw to prevent app start in dev
  }
}
