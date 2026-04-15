import { neon } from '@neondatabase/serverless'
import { Patient, WaiterRecord, AuditLog, DEFAULT_SETTINGS, OrderType } from './types'
import { resolveDatabaseUrl } from './db-mode'
import { BOARD_SOURCE_APP, DEFAULT_ACTIVE_LOCATION } from './launch-context'
import {
  WorkflowEventPayload,
  WorkflowEventStoragePayload,
  WorkflowEventType,
  buildWorkflowEventPayload,
  hydrateWorkflowEventPayload,
  isExpiredReadyRecord,
  toWorkflowEventStoragePayload,
} from './workflow-events'

let sqlInstance: ReturnType<typeof neon> | null = null

const getDb = () => {
  if (!sqlInstance) {
    sqlInstance = neon(resolveDatabaseUrl(), {
      fetchOptions: {
        cache: 'no-store' as RequestCache
      }
    })
  }
  return sqlInstance
}

let initialized = false
let initPromise: Promise<void> | null = null

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 't'
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeWaiterRecord(row: Record<string, unknown>): WaiterRecord {
  const firstName = toText(row.first_name)
  const lastName = toText(row.last_name)
  const patientName = toText(row.patient_name, `${firstName} ${lastName}`.trim())

  return {
    id: Number(row.id),
    patient_id: toNullableNumber(row.patient_id),
    mrn: toText(row.mrn),
    patient_name: patientName,
    first_name: firstName,
    last_name: lastName,
    dob: toText(row.dob),
    num_prescriptions: Number(row.num_prescriptions ?? 0),
    comments: toText(row.comments),
    initials: toText(row.initials),
    order_type: toText(row.order_type, 'waiter') as OrderType,
    due_time: toText(row.due_time),
    created_at: toText(row.created_at),
    active_location_id: toText(row.active_location_id, DEFAULT_ACTIVE_LOCATION.id),
    active_location_name: toText(row.active_location_name, DEFAULT_ACTIVE_LOCATION.name),
    source_app: toText(row.source_app, BOARD_SOURCE_APP),
    source_record_id: toNullableNumber(row.source_record_id),
    printed: toBoolean(row.printed),
    ready: toBoolean(row.ready),
    ready_at: row.ready_at ? String(row.ready_at) : null,
    completed: toBoolean(row.completed),
    moved_to_mail: toBoolean(row.moved_to_mail),
    moved_to_mail_at: row.moved_to_mail_at ? String(row.moved_to_mail_at) : null,
    mailed: toBoolean(row.mailed),
    mailed_at: row.mailed_at ? String(row.mailed_at) : null,
  }
}

export interface WorkflowEventRow {
  id: number
  event_type: WorkflowEventType
  event_key: string | null
  record_id: number
  payload: WorkflowEventPayload
  created_at: string
}

function parseWorkflowEventPayload(value: unknown): WorkflowEventStoragePayload {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Invalid workflow event payload')
  }

  const parsed = JSON.parse(value) as WorkflowEventStoragePayload
  if (!parsed || typeof parsed !== 'object' || !('type' in parsed) || !('recordId' in parsed)) {
    throw new Error('Invalid workflow event payload')
  }
  return parsed
}

function normalizeWorkflowEventRow(row: Record<string, unknown>): WorkflowEventRow {
  const payload = hydrateWorkflowEventPayload(
    Number(row.id),
    parseWorkflowEventPayload(row.payload),
  )

  return {
    id: Number(row.id),
    event_type: String(row.event_type) as WorkflowEventType,
    event_key: row.event_key ? String(row.event_key) : null,
    record_id: Number(row.record_id),
    payload,
    created_at: toText(row.created_at),
  }
}

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
        patient_id INTEGER,
        mrn TEXT NOT NULL,
        patient_name TEXT NOT NULL DEFAULT '',
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT NOT NULL,
        num_prescriptions INTEGER DEFAULT 1,
        comments TEXT DEFAULT '',
        initials TEXT NOT NULL,
        order_type TEXT DEFAULT 'waiter',
        due_time TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        active_location_id TEXT NOT NULL DEFAULT 'main-pharmacy',
        active_location_name TEXT NOT NULL DEFAULT 'Main Pharmacy',
        source_app TEXT NOT NULL DEFAULT 'PharmacyWaiterBoard',
        source_record_id INTEGER,
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
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS patient_id INTEGER`
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS patient_name TEXT`
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS active_location_id TEXT`
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS active_location_name TEXT`
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS source_app TEXT`
    await sql`ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS source_record_id INTEGER`
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
    await sql`
      CREATE TABLE IF NOT EXISTS workflow_events (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        event_key TEXT UNIQUE,
        record_id INTEGER NOT NULL,
        payload TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    // Create indexes for hot query paths
    await sql`CREATE INDEX IF NOT EXISTS idx_waiter_records_active ON waiter_records(ready, completed)`
    await sql`CREATE INDEX IF NOT EXISTS idx_waiter_records_order_type ON waiter_records(order_type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_waiter_records_due_time ON waiter_records(due_time)`
    await sql`CREATE INDEX IF NOT EXISTS idx_waiter_records_created_at ON waiter_records(created_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_waiter_records_patient_id ON waiter_records(patient_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_waiter_records_location_id ON waiter_records(active_location_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_workflow_events_created_at ON workflow_events(created_at)`
    await sql`
      UPDATE waiter_records
      SET
        patient_name = COALESCE(NULLIF(patient_name, ''), first_name || ' ' || last_name),
        active_location_id = COALESCE(NULLIF(active_location_id, ''), ${DEFAULT_ACTIVE_LOCATION.id}),
        active_location_name = COALESCE(NULLIF(active_location_name, ''), ${DEFAULT_ACTIVE_LOCATION.name}),
        source_app = COALESCE(NULLIF(source_app, ''), ${BOARD_SOURCE_APP})
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
    const count = await sql`SELECT COUNT(*) as cnt FROM patients` as Record<string, unknown>[]
    if (Number(count[0].cnt) === 0) {
      await seedPatients()
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : ''
    const code = (error as Record<string, unknown>)?.code || ''
    if (code === '23505' || errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('duplicate')) {
      // Tables already exist, safe to skip
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
  const rows = await sql`SELECT * FROM patients WHERE mrn = ${mrn} LIMIT 1` as Patient[]
  return rows[0] ?? null
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
  return (rows as Record<string, unknown>[]).map(normalizeWaiterRecord)
}

export async function getRecord(id: number): Promise<WaiterRecord | null> {
  const sql = getDb()
  const rows = await sql`SELECT * FROM waiter_records WHERE id = ${id} LIMIT 1` as WaiterRecord[]
  return rows[0] ? normalizeWaiterRecord(rows[0] as unknown as Record<string, unknown>) : null
}

export async function getActiveRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE ready = FALSE AND completed = FALSE
    ORDER BY due_time ASC
  `
  return (rows as Record<string, unknown>[]).map(normalizeWaiterRecord)
}

export async function getReadyWaiterRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const settings = await getSettings()
  const rawAutoClearMinutes = Number(settings.auto_clear_minutes ?? DEFAULT_SETTINGS.auto_clear_minutes)
  const autoClearMinutes = Number.isFinite(rawAutoClearMinutes) && rawAutoClearMinutes > 0
    ? rawAutoClearMinutes
    : DEFAULT_SETTINGS.auto_clear_minutes
  const cutoff = new Date(Date.now() - autoClearMinutes * 60 * 1000).toISOString()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE ready = TRUE
      AND completed = FALSE
      AND order_type = 'waiter'
      AND (ready_at IS NULL OR ready_at > ${cutoff}::timestamptz)
    ORDER BY ready_at ASC
  `
  return (rows as Record<string, unknown>[]).map(normalizeWaiterRecord)
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
  return (rows as Record<string, unknown>[]).map(normalizeWaiterRecord)
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
  return (rows as Record<string, unknown>[]).map(normalizeWaiterRecord)
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
  return (rows as Record<string, unknown>[]).map(normalizeWaiterRecord)
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
  return (rows as Record<string, unknown>[]).map(normalizeWaiterRecord)
}

export async function createRecord(data: {
  mrn: string
  patient_id?: number | null
  patient_name?: string
  first_name: string
  last_name: string
  dob: string
  num_prescriptions: number
  comments: string
  initials: string
  order_type: OrderType
  due_time: string
  active_location_id?: string
  active_location_name?: string
  source_app?: string
  source_record_id?: number | null
}): Promise<WaiterRecord> {
  const sql = getDb()
  const patientName = data.patient_name?.trim() || `${data.first_name} ${data.last_name}`.trim()
  const activeLocationId = data.active_location_id?.trim() || DEFAULT_ACTIVE_LOCATION.id
  const activeLocationName = data.active_location_name?.trim() || DEFAULT_ACTIVE_LOCATION.name
  const sourceApp = data.source_app?.trim() || BOARD_SOURCE_APP
  const rows = await sql`
    INSERT INTO waiter_records (
      patient_id,
      mrn,
      patient_name,
      first_name,
      last_name,
      dob,
      num_prescriptions,
      comments,
      initials,
      order_type,
      due_time,
      active_location_id,
      active_location_name,
      source_app,
      source_record_id
    )
    VALUES (
      ${data.patient_id ?? null},
      ${data.mrn},
      ${patientName},
      ${data.first_name},
      ${data.last_name},
      ${data.dob},
      ${data.num_prescriptions},
      ${data.comments},
      ${data.initials},
      ${data.order_type},
      ${data.due_time}::timestamptz,
      ${activeLocationId},
      ${activeLocationName},
      ${sourceApp},
      ${data.source_record_id ?? null}
    )
    RETURNING *
  ` as WaiterRecord[]
  const record = normalizeWaiterRecord(rows[0] as unknown as Record<string, unknown>)
  await logAudit(record.id, 'CREATE', null, record, data.initials)
  await appendWorkflowEvent({
    eventType: 'create',
    record,
    previousRecord: null,
    actorInitials: data.initials,
  })
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
  staffInitials?: string,
  auditAction: WorkflowEventType = 'update'
): Promise<WaiterRecord | null> {
  const sql = getDb()
  const existing = await sql`SELECT * FROM waiter_records WHERE id = ${id}` as WaiterRecord[]
  if (!existing[0]) return null
  const old = normalizeWaiterRecord(existing[0] as unknown as Record<string, unknown>)

  let rows: WaiterRecord[]

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
    ` as WaiterRecord[]
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
    ` as WaiterRecord[]
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
    ` as WaiterRecord[]
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
    ` as WaiterRecord[]
  }

  const updated = normalizeWaiterRecord(rows[0] as unknown as Record<string, unknown>)
  await logAudit(id, auditAction.toUpperCase(), old, updated, staffInitials)
  await appendWorkflowEvent({
    eventType: auditAction,
    record: updated,
    previousRecord: old,
    actorInitials: staffInitials ?? null,
  })
  return updated
}

export async function deleteRecord(id: number): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`DELETE FROM waiter_records WHERE id = ${id} RETURNING id` as Record<string, unknown>[]
  return rows.length > 0
}

export async function getSettings(): Promise<Record<string, unknown>> {
  const sql = getDb()
  const rows = await sql`SELECT key, value FROM settings` as Record<string, unknown>[]
  const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS }
  for (const row of rows) {
    const key = row.key as string
    const value = row.value as string
    try { settings[key] = JSON.parse(value) } catch { settings[key] = value }
  }
  return settings
}

export async function updateSettings(updates: Record<string, unknown>): Promise<void> {
  const sql = getDb()
  for (const [key, value] of Object.entries(updates)) {
    const jsonValue = JSON.stringify(value)
    try {
      await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES (${key}, ${jsonValue}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        RETURNING key, value
      `
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error)
      throw error
    }
  }
}

export async function getAuditLog(limit = 100): Promise<AuditLog[]> {
  const sql = getDb()
  const rows = await sql`SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ${limit}`
  return rows as AuditLog[]
}

export async function getRecordAuditLog(recordId: number, limit = 100): Promise<AuditLog[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM audit_log
    WHERE record_id = ${recordId}
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `
  return rows as AuditLog[]
}

async function logAudit(recordId: number, action: string, oldValues: WaiterRecord | null, newValues: WaiterRecord | null, initials?: string) {
  const sql = getDb()
  await sql`
    INSERT INTO audit_log (record_id, action, old_values, new_values, staff_initials)
    VALUES (${recordId}, ${action}, ${oldValues ? JSON.stringify(oldValues) : null}, ${newValues ? JSON.stringify(newValues) : null}, ${initials ?? null})
  `
}

export async function appendWorkflowEvent({
  eventType,
  record,
  previousRecord = null,
  actorInitials = null,
  reason = null,
  eventKey = null,
}: {
  eventType: WorkflowEventType
  record: WaiterRecord
  previousRecord?: WaiterRecord | null
  actorInitials?: string | null
  reason?: 'auto_clear' | null
  eventKey?: string | null
}): Promise<WorkflowEventRow | null> {
  const sql = getDb()
  const payload = buildWorkflowEventPayload({
    id: 0,
    type: eventType,
    record,
    previousRecord,
    actorInitials,
    reason,
  })
  const storagePayload = toWorkflowEventStoragePayload(payload)
  const rows = eventKey
    ? await sql`
        INSERT INTO workflow_events (event_type, event_key, record_id, payload)
        VALUES (${eventType}, ${eventKey}, ${record.id}, ${JSON.stringify(storagePayload)})
        ON CONFLICT (event_key) DO NOTHING
        RETURNING *
      `
    : await sql`
        INSERT INTO workflow_events (event_type, record_id, payload)
        VALUES (${eventType}, ${record.id}, ${JSON.stringify(storagePayload)})
        RETURNING *
      `

  const row = (rows as Record<string, unknown>[])[0]
  return row ? normalizeWorkflowEventRow(row) : null
}

export async function getWorkflowEventsSince(afterId = 0, limit = 200): Promise<WorkflowEventRow[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM workflow_events
    WHERE id > ${afterId}
    ORDER BY id ASC
    LIMIT ${limit}
  `
  return (rows as Record<string, unknown>[]).map(normalizeWorkflowEventRow)
}

export async function getLatestWorkflowEventId(): Promise<number> {
  const sql = getDb()
  const rows = await sql`SELECT id FROM workflow_events ORDER BY id DESC LIMIT 1` as Record<string, unknown>[]
  return rows[0] ? Number(rows[0].id) : 0
}

export async function syncExpiredWorkflowEvents(): Promise<WorkflowEventRow[]> {
  const sql = getDb()
  const settings = await getSettings()
  const autoClearMinutes = Number(settings.auto_clear_minutes ?? DEFAULT_SETTINGS.auto_clear_minutes)
  const normalizedAutoClearMinutes = Number.isFinite(autoClearMinutes) && autoClearMinutes > 0
    ? autoClearMinutes
    : DEFAULT_SETTINGS.auto_clear_minutes

  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE order_type = 'waiter'
      AND ready = TRUE
      AND completed = FALSE
      AND ready_at IS NOT NULL
      AND ready_at <= NOW() - (${normalizedAutoClearMinutes} * INTERVAL '1 minute')
    ORDER BY ready_at ASC
  `

  const expiredEvents: WorkflowEventRow[] = []
  for (const row of rows as Record<string, unknown>[]) {
    const record = normalizeWaiterRecord(row)
    if (!isExpiredReadyRecord(record, normalizedAutoClearMinutes)) continue
    const eventKey = `expiration:${record.id}:${record.ready_at}`
    const inserted = await appendWorkflowEvent({
      eventType: 'expiration',
      record,
      previousRecord: record,
      actorInitials: null,
      reason: 'auto_clear',
      eventKey,
    })
    if (inserted) {
      expiredEvents.push(inserted)
    }
  }

  return expiredEvents
}
