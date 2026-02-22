import Database from 'better-sqlite3'
import path from 'path'
import { Patient, WaiterRecord, Settings, AuditLog, DEFAULT_SETTINGS, OrderType } from './types'

const dbPath = path.join(process.cwd(), 'pharmacy.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mrn TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS waiter_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mrn TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      num_prescriptions INTEGER DEFAULT 1,
      comments TEXT DEFAULT '',
      initials TEXT NOT NULL,
      order_type TEXT DEFAULT 'waiter',
      due_time DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      printed INTEGER DEFAULT 0,
      ready INTEGER DEFAULT 0,
      ready_at DATETIME,
      completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      staff_initials TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export function getSetting(key: string): string | null {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
  const row = stmt.get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
  `)
  stmt.run(key, value, value)
}

export function getAllSettings(): Settings {
  const settings = { ...DEFAULT_SETTINGS }
  const stmt = db.prepare('SELECT key, value FROM settings')
  const rows = stmt.all() as { key: string; value: string }[]
  
  for (const row of rows) {
    const key = row.key as keyof Settings
    if (key in settings) {
      const value = row.value
      if (typeof DEFAULT_SETTINGS[key] === 'number') {
        (settings as Record<string, unknown>)[key] = parseInt(value, 10)
      } else if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
        (settings as Record<string, unknown>)[key] = value === 'true'
      } else {
        (settings as Record<string, unknown>)[key] = value
      }
    }
  }
  
  return settings
}

export function updateSettings(newSettings: Partial<Settings>): void {
  for (const [key, value] of Object.entries(newSettings)) {
    setSetting(key, String(value))
  }
}

export function searchPatientsByMRN(mrn: string): Patient | null {
  const stmt = db.prepare('SELECT * FROM patients WHERE mrn = ?')
  return stmt.get(mrn) as Patient | undefined ?? null
}

export function getAllPatients(): Patient[] {
  const stmt = db.prepare('SELECT * FROM patients ORDER BY last_name')
  return stmt.all() as Patient[]
}

export function createPatient(patient: Omit<Patient, 'id' | 'created_at'>): Patient {
  const stmt = db.prepare(`
    INSERT INTO patients (mrn, first_name, last_name, dob)
    VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(patient.mrn, patient.first_name, patient.last_name, patient.dob)
  return {
    id: result.lastInsertRowid as number,
    ...patient,
    created_at: new Date().toISOString(),
  }
}

export function getAllWaiterRecords(): WaiterRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM waiter_records 
    WHERE completed = 0 
    ORDER BY due_time ASC
  `)
  const rows = stmt.all() as Record<string, unknown>[]
  return rows.map((row) => ({
    ...row,
    printed: !!row.printed,
    ready: !!row.ready,
    completed: !!row.completed,
  })) as WaiterRecord[]
}

export function getProductionBoardRecords(): WaiterRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM waiter_records 
    WHERE completed = 0 AND ready = 0
    ORDER BY due_time ASC
  `)
  const rows = stmt.all() as Record<string, unknown>[]
  return rows.map((row) => ({
    ...row,
    printed: !!row.printed,
    ready: !!row.ready,
    completed: !!row.completed,
  })) as WaiterRecord[]
}

export function getPatientBoardRecords(): WaiterRecord[] {
  const settings = getAllSettings()
  const stmt = db.prepare(`
    SELECT * FROM waiter_records 
    WHERE completed = 0 AND ready = 1 AND order_type = 'waiter'
    AND ready_at > datetime('now', '-${settings.auto_clear_minutes} minutes')
    ORDER BY ready_at DESC
  `)
  const rows = stmt.all() as Record<string, unknown>[]
  return rows.map((row) => ({
    ...row,
    printed: !!row.printed,
    ready: !!row.ready,
    completed: !!row.completed,
  })) as WaiterRecord[]
}

export function getWaiterRecord(id: number): WaiterRecord | null {
  const stmt = db.prepare('SELECT * FROM waiter_records WHERE id = ?')
  const row = stmt.get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    ...row,
    printed: !!row.printed,
    ready: !!row.ready,
    completed: !!row.completed,
  } as WaiterRecord
}

export function createWaiterRecord(record: Omit<WaiterRecord, 'id' | 'created_at' | 'printed' | 'ready' | 'ready_at' | 'completed'>): WaiterRecord {
  const stmt = db.prepare(`
    INSERT INTO waiter_records (
      mrn, first_name, last_name, dob, num_prescriptions, comments, initials,
      order_type, due_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    record.mrn,
    record.first_name,
    record.last_name,
    record.dob,
    record.num_prescriptions,
    record.comments,
    record.initials,
    record.order_type,
    record.due_time
  )
  
  addAuditLog(result.lastInsertRowid as number, 'create', null, JSON.stringify(record), record.initials)
  
  return getWaiterRecord(result.lastInsertRowid as number)!
}

export function updateWaiterRecord(id: number, updates: Partial<WaiterRecord>, initials?: string): WaiterRecord | null {
  const oldRecord = getWaiterRecord(id)
  if (!oldRecord) return null
  
  const fields: string[] = []
  const values: unknown[] = []
  
  if (updates.comments !== undefined) {
    fields.push('comments = ?')
    values.push(updates.comments)
  }
  if (updates.initials !== undefined) {
    fields.push('initials = ?')
    values.push(updates.initials)
  }
  if (updates.printed !== undefined) {
    fields.push('printed = ?')
    values.push(updates.printed ? 1 : 0)
  }
  if (updates.ready !== undefined) {
    fields.push('ready = ?')
    values.push(updates.ready ? 1 : 0)
    if (updates.ready) {
      fields.push('ready_at = datetime("now")')
    }
  }
  if (updates.completed !== undefined) {
    fields.push('completed = ?')
    values.push(updates.completed ? 1 : 0)
  }
  
  if (fields.length === 0) return oldRecord
  
  values.push(id)
  const stmt = db.prepare(`UPDATE waiter_records SET ${fields.join(', ')} WHERE id = ?`)
  stmt.run(...values)
  
  addAuditLog(id, 'update', JSON.stringify(oldRecord), JSON.stringify(updates), initials)
  
  return getWaiterRecord(id)
}

export function deleteWaiterRecord(id: number, initials?: string): boolean {
  const record = getWaiterRecord(id)
  if (!record) return false
  
  addAuditLog(id, 'delete', JSON.stringify(record), null, initials)
  
  const stmt = db.prepare('DELETE FROM waiter_records WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function addAuditLog(recordId: number, action: string, oldValues: string | null, newValues: string | null, initials?: string): void {
  const stmt = db.prepare(`
    INSERT INTO audit_log (record_id, action, old_values, new_values, staff_initials)
    VALUES (?, ?, ?, ?, ?)
  `)
  stmt.run(recordId, action, oldValues, newValues, initials ?? null)
}

export function getAuditLog(limit = 100): AuditLog[] {
  const stmt = db.prepare(`
    SELECT * FROM audit_log 
    ORDER BY timestamp DESC 
    LIMIT ?
  `)
  return stmt.all(limit) as AuditLog[]
}

export function calculateDueTime(orderType: OrderType): string {
  const settings = getAllSettings()
  const minutes = orderType === 'waiter' 
    ? settings.waiter_due_minutes 
    : orderType === 'acute' 
      ? settings.acute_due_minutes 
      : settings.urgent_due_minutes
  
  const stmt = db.prepare(`SELECT datetime('now', '+${minutes} minutes') as due_time`)
  const result = stmt.get() as { due_time: string }
  return result.due_time
}

export function cleanupOldRecords(): void {
  const settings = getAllSettings()
  db.prepare(`
    UPDATE waiter_records 
    SET completed = 1 
    WHERE ready = 1 
    AND order_type = 'waiter'
    AND ready_at < datetime('now', '-${settings.auto_clear_minutes} minutes')
    AND completed = 0
  `).run()
}

initializeDatabase()

export default db
