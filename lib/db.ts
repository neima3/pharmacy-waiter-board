import { neon } from '@neondatabase/serverless'
import { Patient, WaiterRecord, DEFAULT_SETTINGS, OrderType } from './types'

let sqlInstance: ReturnType<typeof neon> | null = null

const getDb = () => {
  if (!sqlInstance) {
    sqlInstance = neon(process.env.DATABASE_URL!, {
      fetchOptions: {
        cache: 'no-store' as RequestCache
      }
    })
  }
  return sqlInstance
}

let initialized = false
let initPromise: Promise<void> | null = null

export async function initializeDatabase() {
  if (initialized) return
  if (initPromise) return initPromise
  initPromise = _initDb()
  await initPromise
  initialized = true
}

async function _initDb() {
  const sql = getDb()
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        mrn TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS waiter_records (
        id SERIAL PRIMARY KEY,
        mrn TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT NOT NULL,
        num_prescriptions INTEGER DEFAULT 1,
        comments TEXT DEFAULT '',
        initials TEXT NOT NULL,
        order_type TEXT DEFAULT 'waiter',
        due_time TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        printed BOOLEAN DEFAULT FALSE,
        ready BOOLEAN DEFAULT FALSE,
        ready_at TIMESTAMPTZ,
        completed BOOLEAN DEFAULT FALSE,
        moved_to_mail BOOLEAN DEFAULT FALSE,
        moved_to_mail_at TIMESTAMPTZ,
        mailed BOOLEAN DEFAULT FALSE,
        mailed_at TIMESTAMPTZ
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        record_id INTEGER,
        action TEXT NOT NULL,
        old_values TEXT,
        new_values TEXT,
        staff_initials TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      )
    `
    // Insert default settings
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await sql`
        INSERT INTO settings (key, value)
        VALUES (${key}, ${JSON.stringify(value)})
        ON CONFLICT (key) DO NOTHING
      `
    }
    // Seed patients if empty
    const count = (await sql`SELECT COUNT(*) as cnt FROM patients`) as unknown as any[]
    if (Number(count[0].cnt) === 0) {
      await seedPatients()
    }
  } catch (error: any) {
    const errMsg = error?.message || ''
    const code = error?.code || ''
    if (code === '23505' || errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('duplicate')) {
      console.log('Database init: tables already exist, skipping')
    } else {
      console.error('Database init error:', error)
    }
  } finally {
    initialized = true
  }
}

async function seedPatients() {
  const sql = getDb()
  const patients = [
    { mrn: 'MRN-10001', first_name: 'James', last_name: 'Anderson', dob: '1965-03-14' },
    { mrn: 'MRN-10002', first_name: 'Maria', last_name: 'Rodriguez', dob: '1978-07-22' },
    { mrn: 'MRN-10003', first_name: 'Robert', last_name: 'Thompson', dob: '1952-11-08' },
    { mrn: 'MRN-10004', first_name: 'Patricia', last_name: 'Williams', dob: '1983-04-30' },
    { mrn: 'MRN-10005', first_name: 'Michael', last_name: 'Johnson', dob: '1970-09-17' },
    { mrn: 'MRN-10006', first_name: 'Linda', last_name: 'Brown', dob: '1961-12-05' },
    { mrn: 'MRN-10007', first_name: 'David', last_name: 'Garcia', dob: '1988-02-28' },
    { mrn: 'MRN-10008', first_name: 'Barbara', last_name: 'Martinez', dob: '1975-06-19' },
    { mrn: 'MRN-10009', first_name: 'William', last_name: 'Davis', dob: '1945-08-11' },
    { mrn: 'MRN-10010', first_name: 'Susan', last_name: 'Wilson', dob: '1990-01-23' },
    { mrn: 'MRN-10011', first_name: 'Richard', last_name: 'Miller', dob: '1967-05-16' },
    { mrn: 'MRN-10012', first_name: 'Nancy', last_name: 'Taylor', dob: '1982-10-07' },
    { mrn: 'MRN-10013', first_name: 'Thomas', last_name: 'Moore', dob: '1955-03-29' },
    { mrn: 'MRN-10014', first_name: 'Karen', last_name: 'Jackson', dob: '1979-08-14' },
    { mrn: 'MRN-10015', first_name: 'Charles', last_name: 'Harris', dob: '1963-11-01' },
    { mrn: 'MRN-10016', first_name: 'Betty', last_name: 'White', dob: '1993-07-08' },
    { mrn: 'MRN-10017', first_name: 'Christopher', last_name: 'Martin', dob: '1971-04-25' },
    { mrn: 'MRN-10018', first_name: 'Sandra', last_name: 'Thompson', dob: '1986-09-12' },
    { mrn: 'MRN-10019', first_name: 'Daniel', last_name: 'Lee', dob: '1948-02-18' },
    { mrn: 'MRN-10020', first_name: 'Ashley', last_name: 'Clark', dob: '1995-06-03' },
  ]
  for (const p of patients) {
    await sql`
      INSERT INTO patients (mrn, first_name, last_name, dob)
      VALUES (${p.mrn}, ${p.first_name}, ${p.last_name}, ${p.dob})
      ON CONFLICT (mrn) DO NOTHING
    `
  }
}

export async function getPatientByMRN(mrn: string): Promise<Patient | null> {
  const sql = getDb()
  const rows = (await sql`SELECT * FROM patients WHERE mrn = ${mrn} LIMIT 1`) as unknown as any[]
  return (rows[0] as Patient) ?? null
}

export async function getProductionRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE ready = FALSE 
      AND completed = FALSE
      AND order_type IN ('waiter', 'acute', 'urgent_mail')
    ORDER BY due_time ASC
  `
  return rows as WaiterRecord[]
}

export async function getRecord(id: number): Promise<WaiterRecord | null> {
  const sql = getDb()
  const rows = (await sql`SELECT * FROM waiter_records WHERE id = ${id} LIMIT 1`) as unknown as any[]
  return (rows[0] as WaiterRecord) ?? null
}

export async function getActiveRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE ready = FALSE AND completed = FALSE
    ORDER BY due_time ASC
  `
  return rows as WaiterRecord[]
}

export async function getReadyWaiterRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const cutoff = new Date(Date.now() - 45 * 60 * 1000).toISOString()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE ready = TRUE
      AND completed = FALSE
      AND order_type = 'waiter'
      AND (ready_at IS NULL OR ready_at > ${cutoff}::timestamptz)
    ORDER BY ready_at ASC
  `
  return rows as WaiterRecord[]
}

export async function getCompletedRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE ready = TRUE 
      AND completed = FALSE
      AND order_type IN ('waiter', 'acute')
    ORDER BY ready_at DESC
  `
  return rows as WaiterRecord[]
}

export async function getMailQueueRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE order_type = 'mail' 
      AND moved_to_mail = FALSE
      AND mailed = FALSE
    ORDER BY created_at ASC
  `
  return rows as WaiterRecord[]
}

export async function getCompletedMailRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE (
      (order_type = 'mail' AND moved_to_mail = TRUE AND mailed = FALSE)
      OR
      (order_type = 'urgent_mail' AND ready = TRUE AND mailed = FALSE)
    )
    ORDER BY 
      CASE WHEN moved_to_mail = TRUE THEN moved_to_mail_at ELSE ready_at END ASC
  `
  return rows as WaiterRecord[]
}

export async function getMailHistoryRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE order_type IN ('mail', 'urgent_mail')
      AND mailed = TRUE
    ORDER BY mailed_at DESC
    LIMIT 100
  `
  return rows as WaiterRecord[]
}

export async function createRecord(data: {
  mrn: string
  first_name: string
  last_name: string
  dob: string
  num_prescriptions: number
  comments: string
  initials: string
  order_type: OrderType
  due_time: string
}): Promise<WaiterRecord> {
  const sql = getDb()
  const rows = (await sql`
    INSERT INTO waiter_records (mrn, first_name, last_name, dob, num_prescriptions, comments, initials, order_type, due_time)
    VALUES (${data.mrn}, ${data.first_name}, ${data.last_name}, ${data.dob}, ${data.num_prescriptions}, ${data.comments}, ${data.initials}, ${data.order_type}, ${data.due_time}::timestamptz)
    RETURNING *
  `) as unknown as any[]
  const record = rows[0] as WaiterRecord
  await logAudit(record.id, 'CREATE', null, record, data.initials)
  return record
}

export async function updateRecord(
  id: number,
  updates: {
    comments?: string
    initials?: string
    num_prescriptions?: number
    printed?: boolean
    ready?: boolean
    completed?: boolean
    moved_to_mail?: boolean
    mailed?: boolean
  },
  staffInitials?: string
): Promise<WaiterRecord | null> {
  const sql = getDb()
  const existing = (await sql`SELECT * FROM waiter_records WHERE id = ${id}`) as unknown as any[]
  if (!existing[0]) return null
  const old = existing[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any

  if (updates.ready === true) {
    rows = await sql`
      UPDATE waiter_records SET
        comments = COALESCE(${updates.comments ?? null}, comments),
        initials = COALESCE(${updates.initials ?? null}, initials),
        num_prescriptions = COALESCE(${updates.num_prescriptions ?? null}, num_prescriptions),
        printed = COALESCE(${updates.printed ?? null}, printed),
        ready = TRUE,
        ready_at = NOW(),
        completed = COALESCE(${updates.completed ?? null}, completed),
        moved_to_mail = COALESCE(${updates.moved_to_mail ?? null}, moved_to_mail),
        mailed = COALESCE(${updates.mailed ?? null}, mailed)
      WHERE id = ${id}
      RETURNING *
    `
  } else if (updates.moved_to_mail === true) {
    rows = await sql`
      UPDATE waiter_records SET
        comments = COALESCE(${updates.comments ?? null}, comments),
        initials = COALESCE(${updates.initials ?? null}, initials),
        num_prescriptions = COALESCE(${updates.num_prescriptions ?? null}, num_prescriptions),
        printed = COALESCE(${updates.printed ?? null}, printed),
        ready = COALESCE(${updates.ready ?? null}, ready),
        completed = COALESCE(${updates.completed ?? null}, completed),
        moved_to_mail = TRUE,
        moved_to_mail_at = NOW(),
        mailed = COALESCE(${updates.mailed ?? null}, mailed)
      WHERE id = ${id}
      RETURNING *
    `
  } else if (updates.mailed === true) {
    rows = await sql`
      UPDATE waiter_records SET
        comments = COALESCE(${updates.comments ?? null}, comments),
        initials = COALESCE(${updates.initials ?? null}, initials),
        num_prescriptions = COALESCE(${updates.num_prescriptions ?? null}, num_prescriptions),
        printed = COALESCE(${updates.printed ?? null}, printed),
        ready = COALESCE(${updates.ready ?? null}, ready),
        completed = COALESCE(${updates.completed ?? null}, completed),
        moved_to_mail = COALESCE(${updates.moved_to_mail ?? null}, moved_to_mail),
        mailed = TRUE,
        mailed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
  } else {
    rows = await sql`
      UPDATE waiter_records SET
        comments = COALESCE(${updates.comments ?? null}, comments),
        initials = COALESCE(${updates.initials ?? null}, initials),
        num_prescriptions = COALESCE(${updates.num_prescriptions ?? null}, num_prescriptions),
        printed = COALESCE(${updates.printed ?? null}, printed),
        ready = COALESCE(${updates.ready ?? null}, ready),
        completed = COALESCE(${updates.completed ?? null}, completed),
        moved_to_mail = COALESCE(${updates.moved_to_mail ?? null}, moved_to_mail),
        mailed = COALESCE(${updates.mailed ?? null}, mailed)
      WHERE id = ${id}
      RETURNING *
    `
  }

  const updated = rows[0] as WaiterRecord
  await logAudit(id, 'UPDATE', old, updated, staffInitials)
  return updated
}

export async function deleteRecord(id: number): Promise<boolean> {
  const sql = getDb()
  const rows = (await sql`DELETE FROM waiter_records WHERE id = ${id} RETURNING id`) as unknown as any[]
  return rows.length > 0
}

export async function getSettings(): Promise<Record<string, any>> {
  const sql = getDb()
  const rows = await sql`SELECT key, value FROM settings`
  console.log('Raw settings rows from DB:', rows)
  const settings: Record<string, any> = { ...DEFAULT_SETTINGS }
  for (const row of rows as any[]) {
    try { settings[row.key] = JSON.parse(row.value) } catch { settings[row.key] = row.value }
  }
  console.log('Parsed settings:', settings)
  return settings
}

export async function updateSettings(updates: Record<string, any>): Promise<void> {
  const sql = getDb()
  for (const [key, value] of Object.entries(updates)) {
    const jsonValue = JSON.stringify(value)
    console.log(`Updating setting ${key} = ${jsonValue}`)
    try {
      const result = await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES (${key}, ${jsonValue}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        RETURNING key, value
      `
      console.log(`Upsert result for ${key}:`, result)
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error)
      throw error
    }
  }
}

export async function getAuditLog(limit = 100): Promise<any[]> {
  const sql = getDb()
  const rows = await sql`SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ${limit}`
  return rows as any[]
}

async function logAudit(recordId: number, action: string, oldValues: any, newValues: any, initials?: string) {
  const sql = getDb()
  await sql`
    INSERT INTO audit_log (record_id, action, old_values, new_values, staff_initials)
    VALUES (${recordId}, ${action}, ${oldValues ? JSON.stringify(oldValues) : null}, ${newValues ? JSON.stringify(newValues) : null}, ${initials ?? null})
  `
}
