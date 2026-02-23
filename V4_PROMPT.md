# PharmacyWaiterBoard v4 — Mail Workflow + UX Improvements

You are working on ~/Desktop/Apps/PharmacyWaiterBoard. Next.js 14, TypeScript, Tailwind v3, Framer Motion, Neon Postgres.

Read ALL relevant source files before making changes.

---

## 🐛 BUG FIX

### BUG 1: Settings save STILL failing
The settings save error persists. Debug thoroughly:
1. Check `app/api/settings/route.ts` PUT handler
2. Check `lib/db.ts` `updateSettings()` function
3. Check browser console for the actual error message
4. Add better error logging to both frontend and backend
5. The database init fix (try/catch for 23505) is in place, so the issue is elsewhere
6. Ensure `updateSettings()` properly handles JSON serialization of booleans/numbers
7. Test by running: `curl -X PUT http://localhost:3022/api/settings -H "Content-Type: application/json" -d '{"pharmacy_name":"Test"}'`

---

## ✨ FEATURE CHANGES

### CHANGE 1: MRN Already Optional (verify)
MRN was made optional in v3. Verify it's working on the entry page. If still required, remove validation.

### CHANGE 2: Add DOB to Quick-Add Form
In `components/ProductionBoard.tsx` quick-add form:
- Add a DOB field between Last Name and # Rx
- Make DOB optional (not required)
- Use flexible date parsing that accepts:
  - mmddyy (021590)
  - mmddyyyy (02151990)
  - mm/dd/yyyy (02/15/1990)
  - mm/dd/yy (02/15/90)
  - m/d/yy (2/5/90)
- Store in ISO format (YYYY-MM-DD) in the database

### CHANGE 3: DOB Flexible Input on Entry Page Too
In `components/WaiterForm.tsx`:
- Update DOB input parsing to accept all the same formats
- Keep the date picker but also allow typed input with flexible parsing
- Create a shared `parseFlexibleDate()` utility in `lib/utils.ts`

### CHANGE 4: Larger Comments + Larger Records on Production Board
In `components/ProductionBoard.tsx`:
- Increase comment text size to `text-base` or `text-lg`
- Increase overall row height to accommodate larger text
- Make patient name larger (`text-lg`)
- Make the entire record row feel more substantial

---

## 📦 NEW "MOVE TO MAIL" ORDER TYPE

### Overview
Add a new order type called "Mail" that has a different workflow:
- Entry → "Moved to Mail" → "Mailed" → History (archived)

### Database Changes
In `lib/db.ts`, update `WaiterRecord` type and schema to add:
```typescript
// Add to WaiterRecord interface in lib/types.ts:
moved_to_mail: boolean
moved_to_mail_at: string | null
mailed: boolean
mailed_at: string | null

// Add columns via migration (use prisma-style raw SQL):
ALTER TABLE waiter_records ADD COLUMN moved_to_mail BOOLEAN DEFAULT FALSE;
ALTER TABLE waiter_records ADD COLUMN moved_to_mail_at TIMESTAMPTZ;
ALTER TABLE waiter_records ADD COLUMN mailed BOOLEAN DEFAULT FALSE;
ALTER TABLE waiter_records ADD COLUMN mailed_at TIMESTAMPTZ;
```

Run the migration via Node pg client (same pattern as before):
```bash
node -e "const {Client}=require('pg');const c=new Client({connectionString:'postgresql://neondb_owner:npg_eZ6xqNDPQrH1@ep-crimson-waterfall-ai2glpqn.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'});c.connect().then(()=>c.query('ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS moved_to_mail BOOLEAN DEFAULT FALSE; ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS moved_to_mail_at TIMESTAMPTZ; ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS mailed BOOLEAN DEFAULT FALSE; ALTER TABLE waiter_records ADD COLUMN IF NOT EXISTS mailed_at TIMESTAMPTZ;')).then(()=>{console.log('Migration done');c.end();}).catch(e=>{console.error(e);c.end();});"
```

### Order Type Enum
Update `OrderType` in `lib/types.ts`:
```typescript
export type OrderType = 'waiter' | 'acute' | 'urgent_mail' | 'mail'
```

Add 'mail' option to the order type selector in WaiterForm and quick-add form.

---

## 🎨 PRODUCTION BOARD LAYOUT CHANGES

### Section 1: Active Orders (top)
- Shows: waiter, acute, urgent_mail (NOT mail)
- Current behavior: printed checkbox, ready checkbox, delete
- For urgent_mail: when marked "ready" → moves to Completed Mail section (NOT Completed Orders tab)

### Section 2: Mail Queue (below Active, separate visual section)
- Shows: order_type = 'mail' AND moved_to_mail = FALSE
- Display: Patient Name, DOB, Comments, Time Entered (created_at), Initials
- NO due time countdown (mail doesn't have due time)
- Has "Moved to Mail" checkbox
- When checked → sets moved_to_mail = TRUE, moved_to_mail_at = NOW()
- Visually distinct section (different background color, labeled "Mail Queue")

### Section 3: Completed Mail (below Mail Queue)
- Shows: 
  - order_type = 'mail' AND moved_to_mail = TRUE AND mailed = FALSE
  - order_type = 'urgent_mail' AND ready = TRUE AND mailed = FALSE
- Has "Mailed" checkbox
- When checked → sets mailed = TRUE, mailed_at = NOW()
- After Mailed → moves to History (archived, not shown on main board)

### Section 4: Mail History (collapsed at bottom)
- Shows: (order_type = 'mail' OR order_type = 'urgent_mail') AND mailed = TRUE
- Collapsible section: "Mail History (X items)"
- Shows: Patient Name, Time Entered, Time Mailed
- No checkboxes, just read-only history

---

## 🔄 COMPLETED ORDERS TAB UPDATE

The existing "Completed Orders" tab should ONLY show:
- waiter + acute orders where ready = TRUE AND completed = FALSE

It should NOT show:
- mail orders (those go to Completed Mail section)
- urgent_mail orders (those also go to Completed Mail section)

Update `getCompletedRecords()` in lib/db.ts:
```typescript
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
```

---

## 🛠 API UPDATES

### Update Record API
In `app/api/records/[id]/route.ts` PUT handler, add support for:
- `moved_to_mail: true` → sets moved_to_mail_at = NOW()
- `mailed: true` → sets mailed_at = NOW()

### Get Mail Records
Update `app/api/records/route.ts` GET to support:
- `?type=mail_queue` → mail records where moved_to_mail = FALSE
- `?type=completed_mail` → mail + urgent_mail where moved_to_mail = TRUE AND mailed = FALSE (or ready = TRUE for urgent_mail)
- `?type=mail_history` → mail + urgent_mail where mailed = TRUE

Add these functions to lib/db.ts:
```typescript
export async function getMailQueueRecords(): Promise<WaiterRecord[]>
export async function getCompletedMailRecords(): Promise<WaiterRecord[]>
export async function getMailHistoryRecords(): Promise<WaiterRecord[]>
```

---

## 📝 UTILITY FUNCTION

Add to `lib/utils.ts`:
```typescript
export function parseFlexibleDate(input: string): string | null {
  if (!input) return null
  const cleaned = input.trim().replace(/\s+/g, '')
  
  // mmddyy or mmddyyyy
  if (/^\d{6}$/.test(cleaned)) {
    const mm = cleaned.slice(0, 2)
    const dd = cleaned.slice(2, 4)
    const yy = cleaned.slice(4, 6)
    const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`
    return `${year}-${mm}-${dd}`
  }
  if (/^\d{8}$/.test(cleaned)) {
    const mm = cleaned.slice(0, 2)
    const dd = cleaned.slice(2, 4)
    const yyyy = cleaned.slice(4, 8)
    return `${yyyy}-${mm}-${dd}`
  }
  
  // mm/dd/yy or mm/dd/yyyy or m/d/yy etc
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    const [, m, d, y] = slashMatch
    const mm = m.padStart(2, '0')
    const dd = d.padStart(2, '0')
    const year = y.length === 2 ? (parseInt(y) > 50 ? `19${y}` : `20${y}`) : y
    return `${year}-${mm}-${dd}`
  }
  
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned
  }
  
  return null
}
```

---

## 🎨 UI POLISH

- Mail Queue section: light blue background, "Mail Queue" header
- Completed Mail section: light green background, "Completed Mail" header
- Mail History: collapsed by default, gray background, "Mail History (X items)" header
- Each section should have clear visual separation
- Comments should be prominent (text-base minimum)

---

## ✅ TESTING CHECKLIST

1. Settings save works (test multiple times)
2. MRN optional on entry page
3. DOB flexible input on entry page
4. DOB flexible input on quick-add
5. Create mail order → appears in Mail Queue
6. Check "Moved to Mail" → moves to Completed Mail
7. Check "Mailed" → moves to Mail History
8. Create urgent_mail order → mark ready → appears in Completed Mail
9. Check "Mailed" on urgent_mail → moves to Mail History
10. Regular waiter/acute orders still work with Completed Orders tab
11. Production board sections are visually distinct
12. Comments are larger and readable

---

## 🚀 WHEN DONE

1. `npm run build` — fix ALL errors
2. Start dev server: `PORT=3022 npm run dev &`
3. Test ALL items in checklist above
4. Commit: `git add -A && git commit -m "feat: v4 - mail workflow, flexible DOB, larger UI, settings fix"`
5. Push: `git push origin main`
6. Deploy: `vercel --prod --yes`
7. Notify: `openclaw system event --text "Done: PharmacyWaiterBoard v4 deployed - mail workflow, DOB parsing, UI polish" --mode now`
