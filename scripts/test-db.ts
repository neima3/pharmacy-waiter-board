import { createSqlClient } from './db'

const sql = createSqlClient()

async function test() {
  console.log('1. Checking current pharmacy_name...');
  const rows1 = await sql`SELECT key, value FROM settings WHERE key = 'pharmacy_name'`;
  console.log('Before:', rows1);
  
  console.log('\n2. Updating pharmacy_name...');
  const result = await sql`
    UPDATE settings SET value = '"Updated via test"' WHERE key = 'pharmacy_name'
  `;
  console.log('Update result:', result);
  
  console.log('\n3. Checking after update...');
  const rows2 = await sql`SELECT key, value FROM settings WHERE key = 'pharmacy_name'`;
  console.log('After:', rows2);
  
  process.exit(0);
}

test().catch(console.error)
