# PharmacyWaiterBoard v3 — Bug Fixes + Feature Updates

You are working on an existing pharmacy waiter board app at ~/Desktop/Apps/PharmacyWaiterBoard. The app uses Next.js 14, TypeScript, Tailwind CSS v3, Framer Motion, and Neon Postgres via @neondatabase/serverless.

Read ALL existing source files before making changes. Understand the full codebase first.

---

## 🐛 BUG FIXES (MUST FIX)

### BUG 1: Settings save fails
The `initializeDatabase()` function in lib/db.ts is called on every API request but causes race conditions on Neon Postgres (concurrent DDL fails). Fix by:
- Wrapping the entire `_initDb()` body in try/catch, catching pg error code '23505' (duplicate key) and any "already exists" error silently
- Also add `initialized = true` even when catching those errors so future calls skip the init entirely
- In `updateSettings()`: make sure it handles JSON serialization of ALL types (booleans, numbers, strings) correctly

### BUG 2: Settings PUT response
The settings API (app/api/settings/route.ts) PUT handler should return 200 with updated settings. Make sure it returns `NextResponse.json(settings)` and logs any error clearly.

---

## ✨ FEATURE CHANGES

### CHANGE 1: MRN is now OPTIONAL
In `components/WaiterForm.tsx` and `app/entry/page.tsx`:
- Remove MRN from required field validation
- If MRN is empty, still allow form submission (use empty string)
- In `app/api/records/route.ts`, remove MRN from required fields check (only first_name, last_name, initials are required)

### CHANGE 2: Patient board name masking — handle short last names
In `lib/utils.ts`, update `maskName()`:
- Last name 1–3 chars: show first 2 letters + `*` (e.g. "Lee" → "Le*")
- Last name 4+ chars: show first 3 letters + `***` (e.g. "Smith" → "Smi***")
- First name 1–2 chars: show as-is (no masking needed)
- First name 3+ chars: show first 2 letters + `***`

### CHANGE 3: Production board redesign — 1 line per record, larger text
Rewrite `components/ProductionBoard.tsx` and `components/RecordCard.tsx`:
- Each record is a SINGLE horizontal row (not a card)
- Table-like layout with columns: [Order Type Badge] | [Patient Name + MRN] | [# Rx] | [Due Time / Countdown] | [Initials] | [Comments] | [Printed ✓] | [Ready ✓] | [Delete]
- Larger font (text-base or text-lg for name/key fields)
- Color-coded left border per order type (green=waiter, blue=acute, purple=urgent)
- Comments: show inline, click to edit. If a comment was edited (different from original), add a small colored dot or "edited" badge next to it to indicate it was updated
- Remove ALL multi-select/bulk action functionality completely
- Rows should be compact but easy to read — not tiny
- Urgency: row background shifts subtly as due time approaches (light yellow → light orange → light red when overdue)

### CHANGE 4: Quick-Add button on production board
Add a "+ Quick Add" button at the top of the production board. When clicked:
- Opens an INLINE form row at the TOP of the records list (not a modal, not a new page)
- Form fields: First Name, Last Name, MRN (optional), # Rx, Initials, Order Type (toggle: W/A/U), Comments
- Submit button adds the record and returns directly to the production board view
- Cancel button closes the inline form
- Keyboard: Tab through fields, Enter to submit

### CHANGE 5: New "Completed Orders" tab on production board
Add a tab switcher at the top of the production board: [Active Orders] [Completed Orders]
- "Active Orders" = current view (ready=FALSE, completed=FALSE)
- "Completed Orders" = shows records that are `ready=TRUE AND completed=FALSE` (ready but not yet fully picked up/dismissed)
  - These are orders ready for patient pickup
  - Each row shows: Order Type, Patient Name, # Rx, Time Ready, Initials, Comments
  - Has a "Mark Complete" button to set completed=TRUE and remove it from patient board
  - No "Printed" or "Ready" checkboxes here — only the Mark Complete action
- This replaces the "Mark as Picked Up" button on the PATIENT-FACING board entirely

### CHANGE 6: Remove "Mark as Picked Up" from patient board
In `components/PatientBoard.tsx`:
- Remove the "Mark as Picked Up" button from the patient-facing board
- The patient board should be CLEAN — only show the name and "please see pharmacist" message
- No buttons, no interactive elements visible to patients
- Staff use the "Completed Orders" tab on the production board to mark items complete

### CHANGE 7: Overall Polish
- Fix any TypeScript errors
- Make the production board rows feel clean and professional (like a real pharmacy workflow tool)
- Ensure smooth Framer Motion animations on row add/remove
- Make the Completed Orders tab visually distinct (slightly different background, green tones)

---

## 📋 NEW API ROUTE NEEDED
Add to `app/api/records/route.ts` (or create new file):
The existing GET /api/records?type=production returns active (ready=FALSE) records.
Add support for: GET /api/records?type=completed → returns records where `ready=TRUE AND completed=FALSE`
Update `lib/db.ts` to add:
```typescript
export async function getCompletedRecords(): Promise<WaiterRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM waiter_records
    WHERE ready = TRUE AND completed = FALSE
    ORDER BY ready_at DESC
  `
  return rows as WaiterRecord[]
}
```

---

## 🚀 WHEN DONE

1. Run `npm run build` — fix ALL errors until build passes with code 0
2. Start the dev server: `PORT=3022 npm run dev &` and test all pages
3. Test: create a record, mark printed, mark ready — verify it disappears from Active and appears in Completed tab
4. Test: mark complete in Completed tab — verify it disappears from patient board
5. Test: save settings — verify no error
6. Test: submit form without MRN — verify it works
7. Commit: `git add -A && git commit -m "feat: v3 - bug fixes, 1-line production board, quick-add, completed tab, cleaner patient board"`
8. Push: `git push origin main`
9. Deploy: `vercel --prod --yes`
10. Notify: `openclaw system event --text "Done: PharmacyWaiterBoard v3 deployed - all bugs fixed, production board redesigned" --mode now`
