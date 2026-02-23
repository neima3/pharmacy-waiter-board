import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_eZ6xqNDPQrH1@ep-crimson-waterfall-ai2glpqn.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function migrate() {
  try {
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS moved_to_mail BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS moved_to_mail_at TIMESTAMPTZ`;
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS mailed BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS mailed_at TIMESTAMPTZ`;
    console.log('Migration complete');
  } catch (e) {
    console.error('Migration error:', e);
  }
  process.exit(0);
}

migrate();
