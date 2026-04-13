import { createSqlClient } from './db'

async function test() {
  // Create SQL function with transaction option
  const sql = createSqlClient({
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
  const sql2 = createSqlClient();
  const readResult2 = await sql2`SELECT key, value FROM settings WHERE key = 'pharmacy_name'`;
  console.log('Read from new connection:', readResult2);
  
  process.exit(0);
}

test().catch(console.error)
