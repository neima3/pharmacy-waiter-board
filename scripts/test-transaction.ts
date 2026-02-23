import { neon } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_eZ6xqNDPQrH1@ep-crimson-waterfall-ai2glpqn.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function test() {
  // Create SQL function with transaction option
  const sql = neon(connectionString, { 
    fetchOptions: {
      cache: 'no-store'
    }
  });
  
  console.log('1. Testing within same connection...');
  
  // Update
  const upsertResult = await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('pharmacy_name', '"Same Conn Test"', NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    RETURNING key, value
  `;
  console.log('Upsert result:', upsertResult);
  
  // Immediately read
  const readResult = await sql`SELECT key, value FROM settings WHERE key = 'pharmacy_name'`;
  console.log('Read result:', readResult);
  
  // New connection
  const sql2 = neon(connectionString);
  const readResult2 = await sql2`SELECT key, value FROM settings WHERE key = 'pharmacy_name'`;
  console.log('Read from new connection:', readResult2);
  
  process.exit(0);
}

test().catch(console.error);
