import { createSqlClient } from './db'

const sql = createSqlClient()

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

migrate()
