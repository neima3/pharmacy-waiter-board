import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'pharmacy.db')
const db = new Database(dbPath)

const samplePatients = [
  { mrn: 'MRN-10001', first_name: 'James', last_name: 'Anderson', dob: '1985-03-15' },
  { mrn: 'MRN-10002', first_name: 'Maria', last_name: 'Garcia', dob: '1992-07-22' },
  { mrn: 'MRN-10003', first_name: 'Robert', last_name: 'Johnson', dob: '1978-11-08' },
  { mrn: 'MRN-10004', first_name: 'Emily', last_name: 'Williams', dob: '2001-04-30' },
  { mrn: 'MRN-10005', first_name: 'Michael', last_name: 'Brown', dob: '1967-09-12' },
  { mrn: 'MRN-10006', first_name: 'Sarah', last_name: 'Davis', dob: '1989-12-05' },
  { mrn: 'MRN-10007', first_name: 'David', last_name: 'Miller', dob: '1955-06-18' },
  { mrn: 'MRN-10008', first_name: 'Jennifer', last_name: 'Wilson', dob: '1995-02-28' },
  { mrn: 'MRN-10009', first_name: 'William', last_name: 'Moore', dob: '1972-08-03' },
  { mrn: 'MRN-10010', first_name: 'Linda', last_name: 'Taylor', dob: '1983-01-17' },
  { mrn: 'MRN-10011', first_name: 'Thomas', last_name: 'Anderson', dob: '1948-10-25' },
  { mrn: 'MRN-10012', first_name: 'Patricia', last_name: 'Thomas', dob: '1990-05-09' },
  { mrn: 'MRN-10013', first_name: 'Christopher', last_name: 'Jackson', dob: '1976-07-14' },
  { mrn: 'MRN-10014', first_name: 'Elizabeth', last_name: 'White', dob: '2005-11-21' },
  { mrn: 'MRN-10015', first_name: 'Daniel', last_name: 'Harris', dob: '1963-04-06' },
  { mrn: 'MRN-10016', first_name: 'Barbara', last_name: 'Martin', dob: '1987-09-29' },
  { mrn: 'MRN-10017', first_name: 'Matthew', last_name: 'Thompson', dob: '1952-12-11' },
  { mrn: 'MRN-10018', first_name: 'Susan', last_name: 'Robinson', dob: '1998-03-23' },
  { mrn: 'MRN-10019', first_name: 'Anthony', last_name: 'Clark', dob: '1970-06-07' },
  { mrn: 'MRN-10020', first_name: 'Jessica', last_name: 'Rodriguez', dob: '1984-08-19' },
  { mrn: 'MRN-10021', first_name: 'Neima', last_name: 'Brandon', dob: '1991-04-12' },
  { mrn: 'MRN-10022', first_name: 'Charles', last_name: 'Lewis', dob: '1960-01-30' },
  { mrn: 'MRN-10023', first_name: 'Nancy', last_name: 'Lee', dob: '1973-05-15' },
  { mrn: 'MRN-10024', first_name: 'Steven', last_name: 'Walker', dob: '1982-10-08' },
  { mrn: 'MRN-10025', first_name: 'Karen', last_name: 'Hall', dob: '1945-02-14' },
]

function initializeDatabase() {
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

function seedDatabase() {
  console.log('Initializing database...')
  initializeDatabase()
  
  console.log('Seeding database...')
  
  const insertPatient = db.prepare(`
    INSERT OR IGNORE INTO patients (mrn, first_name, last_name, dob)
    VALUES (?, ?, ?, ?)
  `)
  
  for (const patient of samplePatients) {
    insertPatient.run(patient.mrn, patient.first_name, patient.last_name, patient.dob)
  }
  
  console.log(`Seeded ${samplePatients.length} patients`)
}

seedDatabase()
db.close()
