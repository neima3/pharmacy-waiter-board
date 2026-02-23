import { neon } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_eZ6xqNDPQrH1@ep-crimson-waterfall-ai2glpqn.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(connectionString);

async function test() {
  // Test INSERT ... ON CONFLICT
  console.log('Testing INSERT ... ON CONFLICT');
  
  const key = 'pharmacy_name';
  const value = JSON.stringify('Upsert Test 1');
  
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  
  const result1 = await sql`SELECT key, value FROM settings WHERE key = ${key}`;
  console.log('After upsert 1:', result1);
  
  // Try again with different value
  const value2 = JSON.stringify('Upsert Test 2');
  
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES (${key}, ${value2}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  
  const result2 = await sql`SELECT key, value FROM settings WHERE key = ${key}`;
  console.log('After upsert 2:', result2);
  
  process.exit(0);
}

test().catch(console.error);
