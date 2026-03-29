# PharmacyWaiterBoard 10X Improvement Spec

**Date:** 2026-03-29
**Scope:** Comprehensive quality, architecture, performance, accessibility, and type safety overhaul
**Constraints:** Local dev only, no sacred cows, full creative license, existing dependencies + new ones allowed

---

## Section 1: Component Architecture

### ProductionBoard Decomposition

Break `ProductionBoard.tsx` (~800 lines) into 6 focused components:

| Component | Responsibility |
|-----------|---------------|
| `ProductionBoard.tsx` | Layout shell, tab state, polling orchestration via `usePolling` hook. Renders tab content components. ~120 lines. |
| `ActiveOrdersTab.tsx` | Active orders list with filter-by-type dropdown, search-by-name/MRN input, and bulk action toolbar. Receives records + handlers as props. ~150 lines. |
| `CompletedTab.tsx` | Completed orders list with date range filtering. Simpler than active — read-only display with undo-complete action. ~80 lines. |
| `MailWorkflow.tsx` | Full mail tab: mail queue, completed mail, mail history sub-tabs. Handles move-to-mail, mark-mailed actions. ~150 lines. |
| `QuickAddModal.tsx` | Inline quick-add form currently embedded in ProductionBoard. Opens as modal overlay, uses same validation as WaiterForm. ~80 lines. |
| `BulkActions.tsx` | Select-all checkbox, selection count, bulk print/ready/complete buttons. Receives selected IDs + action handlers. ~60 lines. |

### SettingsPanel Decomposition

Break `SettingsPanel.tsx` (~500 lines) into 3 files:

| File | Responsibility |
|------|---------------|
| `SettingsPanel.tsx` | Layout, save/reset/import/export logic, unsaved changes tracking. Maps over `settingsConfig` to render fields. ~100 lines. |
| `SettingField.tsx` | Generic renderer for a single setting. Accepts type (toggle, number, text, select), label, description, value, onChange. ~80 lines. |
| `settingsConfig.ts` | Declarative array defining all 13 settings: key, label, description, type, default, validation constraints. Single source of truth. ~60 lines. |

### Shared Small Components

| Component | Purpose |
|-----------|---------|
| `OrderTypeBadge.tsx` | Renders order type badge (waiter/acute/urgent_mail/mail) with consistent colors. Currently duplicated in 5+ places. |
| `TimeDisplay.tsx` | Renders countdown or elapsed time with urgency coloring. Consolidates duplicated time formatting. |
| `ConfirmDialog.tsx` | Styled confirmation dialog replacing all `confirm()` calls. Uses Framer Motion for enter/exit. |
| `EmptyState.tsx` | Reusable empty state with icon, message, and optional action button. |

### Custom Hooks

| Hook | Signature | Purpose |
|------|-----------|---------|
| `usePolling` | `(url: string, interval: number) => { data, error, isLoading, refresh }` | Shared polling logic with error state, loading state, pause-on-hidden-tab, and manual refresh. Replaces duplicated `useEffect` + `setInterval` in ProductionBoard and PatientBoard. |
| `useCountdown` | `(dueTime: string) => { remaining, urgency, color, label }` | Timer logic + urgency calculation. Returns both color and text label for accessibility. Extracts from RecordCard and ProductionBoard. |
| `useSettings` | `() => { settings, updateSetting, saveSettings, isLoading }` | Fetch/update settings with in-memory caching. Fetches once, invalidates on save. Replaces per-component settings fetching. |
| `useBulkSelection` | `(items: T[]) => { selected, toggle, selectAll, clearAll, isAllSelected }` | Generic multi-select logic. Extracts from ProductionBoard. |

---

## Section 2: Error Handling & Loading States

### Error Boundary

Create `components/ErrorBoundary.tsx`:
- Class component wrapping each page in `layout.tsx`
- Fallback UI: centered card with error message, retry button, and "Go Home" link
- Logs error to console (no external reporting for now)

### Fetch Wrapper

Create `lib/api.ts`:

```typescript
type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>>
```

- Wraps `fetch` with try/catch
- Checks HTTP status (4xx → parse error body, 5xx → generic message)
- 10-second timeout via `AbortController`
- All API calls in components migrate to use this

### Loading States

- Use existing `Skeleton` components on initial page load (currently defined in `Skeleton.tsx` but underused)
- Add inline loading spinners on action buttons (print, ready, complete) while API call is in-flight
- Disable action buttons during pending state to prevent double-clicks

### Optimistic Updates

For toggle actions (print, ready, complete):
1. Immediately update local state
2. Fire API call
3. On failure: revert local state, show error toast with details
4. On success: next poll confirms (no action needed)

### Confirmation Dialog

Replace all `confirm()` calls with `ConfirmDialog` component:
- Framer Motion animated overlay
- Title, message, confirm/cancel buttons
- Destructive actions get red confirm button
- Returns promise (await user response)

### Toast Improvements

- Specific messages: "Order for Smith, J marked ready" instead of "Updated"
- Error toasts include the HTTP error detail when available
- Use `toast.promise` for async actions (loading → success/error)

---

## Section 3: Database & API Improvements

### Input Validation

Create `lib/validation.ts`:

```typescript
validateMRN(mrn: string): ValidationResult        // non-empty, alphanumeric, max 20 chars
validateName(name: string): ValidationResult       // non-empty, max 100 chars, sanitized
validateDOB(dob: string): ValidationResult         // valid date format, not future
validateOrderType(type: string): ValidationResult  // enum: waiter | acute | urgent_mail | mail
validateComments(text: string): ValidationResult   // max 500 chars, HTML-escaped for XSS
validateInitials(initials: string): ValidationResult // 2-4 alpha chars
```

Apply on all POST/PUT API routes. Return structured 400 responses:
```json
{ "success": false, "error": "Validation failed", "fields": { "mrn": "MRN is required" } }
```

### Database Indexes

Add via migration script in `scripts/add-indexes.ts`:

```sql
CREATE INDEX IF NOT EXISTS idx_waiter_records_active ON waiter_records(ready, completed);
CREATE INDEX IF NOT EXISTS idx_waiter_records_order_type ON waiter_records(order_type);
CREATE INDEX IF NOT EXISTS idx_waiter_records_due_time ON waiter_records(due_time);
CREATE INDEX IF NOT EXISTS idx_waiter_records_created_at ON waiter_records(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);
```

### Transactions

Wrap multi-step operations using Neon's transaction support:
- Mark ready: update record + insert audit log (atomic)
- Move to mail: update record + insert audit log (atomic)
- Delete record: delete record + insert audit log (atomic)
- Bulk operations: wrap entire batch in single transaction

### API Route Cleanup

**Records route** (`/api/records/route.ts`):
- Extract internal functions: `getActiveRecords()`, `getCompletedRecords()`, `getMailRecords()`, `getMailHistory()`
- Each function handles its own query + response shape
- Main handler dispatches based on `type` query param

**Consistent response shape** across all routes:
```typescript
// Success
{ success: true, data: T }
// Error
{ success: false, error: string, fields?: Record<string, string> }
```

### Backend sanitization

- HTML-escape all user-provided strings before DB insert (comments, names)
- Use parameterized queries throughout (already done, but verify no string concatenation)

---

## Section 4: Accessibility & UX Polish

### ARIA Labels

- All buttons: `aria-label` describing action ("Mark order as ready", "Print prescription")
- All inputs: associated `<label>` or `aria-label`
- Tab components: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`
- Modal components: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Checkboxes: `aria-label` with context ("Select order for Smith, J")

### Urgency Indicators

Add text labels alongside color indicators:
- Green → "On Time" badge
- Yellow → "Due Soon" badge
- Orange → "Overdue" badge
- Red → "Critical" badge

These render as small text labels next to the countdown timer, ensuring color-blind users get the same information.

### Keyboard Navigation

- Tab panels: arrow keys to switch tabs, Enter/Space to select
- Modal: Escape to close, focus trapped inside while open
- RecordCard actions: Tab to reach each button, Enter to activate
- QuickAddModal: auto-focus first field on open
- Focus return: when modal closes, focus returns to the element that opened it

### Screen Reader Support

- `aria-live="polite"` on PatientBoard ready orders region — announces new orders
- `aria-live="polite"` on toast container (Sonner may handle this already, verify)
- Visually hidden status text for screen readers where icons convey meaning

### UX Polish

- **Smart polling:** Pause when `document.hidden`, resume on `visibilitychange` event
- **Empty states:** Helpful messages with icons when no orders exist in each tab
- **Success animations:** Checkmark animation on mark-ready, fade-out on complete
- **Better search:** Debounce ProductionBoard search input (300ms)

---

## Section 5: Performance & Type Safety

### Memoization

- `React.memo` on: `RecordCard`, `PatientCard`, `OrderTypeBadge`, `TimeDisplay`, `SettingField`
- `useMemo` on: filtered records lists, sorted records, search results in ProductionBoard
- `useCallback` on: all handler functions passed as props to memoized children

### Smart Polling

- `usePolling` hook pauses interval when `document.hidden === true`
- Resumes immediately on `visibilitychange` (fires a refresh, then restarts interval)
- Prevents unnecessary network requests when user isn't looking at the page

### Settings Caching

- `useSettings` hook fetches settings once on mount, stores in React context
- Components consume via `useSettings()` instead of independent fetches
- Invalidation: re-fetch after `saveSettings()` succeeds
- Eliminates redundant `/api/settings` calls from multiple components

### Type Safety

**Remove all `any` casts.** Specifically:
- `db.ts` line ~281: replace `any` with proper query result types
- API response handlers: type the parsed JSON

**Strict settings types:**
```typescript
type SettingsKey = 'waiter_sla' | 'acute_sla' | 'urgent_sla' | 'font_size' | 'sound_enabled' | 'refresh_interval' | 'privacy_mode' | 'board_title' | 'board_subtitle' | 'completed_display_minutes' | 'auto_complete_minutes' | 'mail_sla' | 'theme' // all 13 keys
type SettingsMap = { [K in SettingsKey]: SettingsValueType<K> }     // mapped types per key
```

**API response types:**
```typescript
type RecordsResponse = ApiResponse<WaiterRecord[]>
type PatientBoardResponse = ApiResponse<{ records: WaiterRecord[], settings: Settings }>
type SettingsResponse = ApiResponse<Settings>
```

**Type guards** for runtime validation:
```typescript
function isWaiterRecord(data: unknown): data is WaiterRecord
function isSettings(data: unknown): data is Settings
```

### Code Deduplication

- `OrderTypeBadge` component replaces 5+ inline badge renders
- `TimeDisplay` component replaces duplicated countdown/elapsed formatting
- `lib/time.ts` consolidates `formatTimeRemaining` and `getTimeRemaining` into unified utilities
- `lib/api.ts` consolidates fetch headers, error parsing, response typing

---

## File Map

### New Files

```
components/
  ErrorBoundary.tsx
  ConfirmDialog.tsx
  OrderTypeBadge.tsx
  TimeDisplay.tsx
  EmptyState.tsx
  ActiveOrdersTab.tsx
  CompletedTab.tsx
  MailWorkflow.tsx
  QuickAddModal.tsx
  BulkActions.tsx
  SettingField.tsx
  settingsConfig.ts

hooks/
  usePolling.ts
  useCountdown.ts
  useSettings.ts
  useBulkSelection.ts

lib/
  api.ts
  validation.ts
  time.ts

scripts/
  add-indexes.ts
```

### Modified Files

```
components/
  ProductionBoard.tsx    (rewrite — shell only, delegates to tab components)
  SettingsPanel.tsx      (rewrite — iterates over settingsConfig)
  RecordCard.tsx         (add memo, ARIA, use TimeDisplay/OrderTypeBadge)
  PatientBoard.tsx       (use usePolling, add aria-live, smart polling)
  WaiterForm.tsx         (use lib/api.ts, add ARIA labels)
  MRNSearch.tsx          (use lib/api.ts, add ARIA labels)
  Navigation.tsx         (add ARIA roles on nav)
  Skeleton.tsx           (wire into loading states)

app/
  layout.tsx             (wrap with ErrorBoundary)
  page.tsx               (add ARIA landmarks)

app/api/
  records/route.ts       (add validation, transactions, extract functions)
  records/[id]/route.ts  (add validation, transactions)
  board/patient/route.ts (consistent response shape)
  patients/search/route.ts (add validation)
  audit/route.ts         (consistent response shape)

lib/
  db.ts                  (remove any casts, add transaction helpers)
  types.ts               (add API response types, settings types, type guards)
```
