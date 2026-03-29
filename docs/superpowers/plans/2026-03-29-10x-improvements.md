# 10X Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comprehensive quality, architecture, performance, accessibility, and type safety overhaul of the PharmacyWaiterBoard app.

**Architecture:** Extract foundation utilities (api, validation, time), create custom hooks (usePolling, useCountdown, useSettings, useBulkSelection), decompose ProductionBoard (800+ lines) and SettingsPanel (500+ lines) into focused sub-components, add shared UI components (OrderTypeBadge, TimeDisplay, ConfirmDialog, EmptyState, ErrorBoundary), improve API routes with validation and consistent responses, add DB indexes, and make a full accessibility + performance pass.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Neon Postgres, Sonner toasts, Lucide icons

---

## Task 1: Foundation Libraries

**Files:**
- Create: `lib/api.ts`
- Create: `lib/validation.ts`
- Create: `lib/time.ts`
- Modify: `lib/types.ts`
- Modify: `lib/db.ts`

- [ ] **Step 1: Create `lib/api.ts` — typed fetch wrapper**

```typescript
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string; fields?: Record<string, string> }

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Request failed (${res.status})`,
        fields: data.fields,
      }
    }
    return { success: true, data: data as T }
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out' }
    }
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}
```

- [ ] **Step 2: Create `lib/validation.ts` — input validators**

```typescript
export type ValidationResult = { valid: true } | { valid: false; message: string }

export function validateMRN(mrn: string): ValidationResult {
  if (!mrn) return { valid: true } // MRN is optional
  if (mrn.length > 20) return { valid: false, message: 'MRN must be 20 characters or less' }
  if (!/^[A-Za-z0-9-]+$/.test(mrn)) return { valid: false, message: 'MRN must be alphanumeric' }
  return { valid: true }
}

export function validateName(name: string, field: string): ValidationResult {
  if (!name.trim()) return { valid: false, message: `${field} is required` }
  if (name.length > 100) return { valid: false, message: `${field} must be 100 characters or less` }
  return { valid: true }
}

export function validateInitials(initials: string): ValidationResult {
  if (!initials.trim()) return { valid: false, message: 'Initials are required' }
  if (!/^[A-Za-z]{2,4}$/.test(initials)) return { valid: false, message: 'Initials must be 2-4 letters' }
  return { valid: true }
}

export function validateOrderType(type: string): ValidationResult {
  const valid = ['waiter', 'acute', 'urgent_mail', 'mail']
  if (!valid.includes(type)) return { valid: false, message: `Invalid order type: ${type}` }
  return { valid: true }
}

export function validateComments(text: string): ValidationResult {
  if (text.length > 500) return { valid: false, message: 'Comments must be 500 characters or less' }
  return { valid: true }
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }
    return map[c] || c
  })
}

export function validateRecord(body: Record<string, unknown>): { valid: true } | { valid: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {}
  const checks = [
    ['mrn', validateMRN(String(body.mrn || ''))],
    ['first_name', validateName(String(body.first_name || ''), 'First name')],
    ['last_name', validateName(String(body.last_name || ''), 'Last name')],
    ['initials', validateInitials(String(body.initials || ''))],
    ['order_type', validateOrderType(String(body.order_type || 'waiter'))],
    ['comments', validateComments(String(body.comments || ''))],
  ] as const

  for (const [field, result] of checks) {
    if (!result.valid) fields[field] = result.message
  }

  return Object.keys(fields).length === 0 ? { valid: true } : { valid: false, fields }
}
```

- [ ] **Step 3: Create `lib/time.ts` — consolidated time utilities**

Move `getTimeRemaining`, `formatTimeRemaining`, `getElapsedMinutes`, `formatTime`, `formatDateTime`, `formatDOB`, `calculateDueTime` from `lib/utils.ts` to `lib/time.ts`. Add urgency helpers:

```typescript
export type UrgencyLevel = 'on-time' | 'due-soon' | 'overdue' | 'critical'

export function getUrgency(dueTime: string): { level: UrgencyLevel; color: string; label: string; bgClass: string } {
  const remaining = Date.parse(dueTime) - Date.now()
  if (remaining < 0) return { level: 'critical', color: 'red', label: 'Overdue', bgClass: 'bg-red-100 text-red-700' }
  if (remaining < 300000) return { level: 'critical', color: 'red', label: 'Critical', bgClass: 'bg-red-100 text-red-700' }
  if (remaining < 600000) return { level: 'overdue', color: 'orange', label: 'Due Soon', bgClass: 'bg-orange-100 text-orange-700' }
  if (remaining < 900000) return { level: 'due-soon', color: 'yellow', label: 'Due Soon', bgClass: 'bg-yellow-100 text-yellow-700' }
  return { level: 'on-time', color: 'green', label: 'On Time', bgClass: 'bg-green-100 text-green-700' }
}

export function getProgressPercentage(dueTime: string, orderType: string): number {
  const totalTime = orderType === 'waiter' ? 30 * 60 * 1000 : 60 * 60 * 1000
  const remaining = Date.parse(dueTime) - Date.now()
  const elapsed = totalTime - remaining
  return Math.min(100, Math.max(0, (elapsed / totalTime) * 100))
}

export function getProgressColor(dueTime: string): string {
  const remaining = Date.parse(dueTime) - Date.now()
  if (remaining < 0 || remaining < 300000) return 'bg-red-500'
  if (remaining < 600000) return 'bg-orange-500'
  if (remaining < 900000) return 'bg-yellow-500'
  return 'bg-green-500'
}
```

Re-export everything from `lib/utils.ts` so existing imports still work. Remove the moved functions from utils.ts and replace with re-exports from time.ts.

- [ ] **Step 4: Update `lib/types.ts` — strict API response types and settings types**

Add to existing types:

```typescript
export type SettingsKey = keyof Settings

export type ApiSuccessResponse<T> = { success: true; data: T }
export type ApiErrorResponse = { success: false; error: string; fields?: Record<string, string> }
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export type RecordsResponse = WaiterRecord[]
export type PatientBoardResponse = WaiterRecord[]
export type SettingsResponse = Settings
```

- [ ] **Step 5: Update `lib/db.ts` — remove `any` casts, add transaction helper**

Replace all `as unknown as any[]` patterns with proper typing using `NeonQueryFunction` return type. Add:

```typescript
import { neon, neonConfig } from '@neondatabase/serverless'

// Transaction helper using Neon HTTP transaction support
export async function withTransaction<T>(fn: (sql: ReturnType<typeof neon>) => Promise<T>): Promise<T> {
  const sql = getDb()
  // Neon serverless doesn't support traditional transactions via HTTP,
  // but we can batch queries. For critical operations, wrap in a try-catch
  // and handle rollback logic manually.
  return fn(sql)
}
```

Remove `// eslint-disable-next-line` comments. Replace `any` with `Record<string, unknown>[]` or specific types. Remove `console.log` statements from `getSettings` and `updateSettings`.

- [ ] **Step 6: Update `lib/utils.ts` — re-export time functions**

Keep `cn`, `maskName`, `parseFlexibleDate`, `getOrderTypeLabel` in utils.ts. Re-export time functions:

```typescript
export { getTimeRemaining, formatTimeRemaining, getElapsedMinutes, formatTime, formatDateTime, formatDOB, calculateDueTime, getUrgency, getProgressPercentage, getProgressColor } from './time'
```

- [ ] **Step 7: Verify build passes**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`
Expected: Build succeeds with no type errors

- [ ] **Step 8: Commit**

```bash
git add lib/api.ts lib/validation.ts lib/time.ts lib/types.ts lib/db.ts lib/utils.ts
git commit -m "feat: add foundation libraries (api, validation, time) and remove any casts"
```

---

## Task 2: Custom Hooks

**Files:**
- Create: `hooks/usePolling.ts`
- Create: `hooks/useCountdown.ts`
- Create: `hooks/useSettings.ts`
- Create: `hooks/useBulkSelection.ts`

- [ ] **Step 1: Create `hooks/usePolling.ts`**

```typescript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api'

interface UsePollingOptions {
  interval: number
  enabled?: boolean
}

interface UsePollingResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  refresh: () => void
}

export function usePolling<T>(url: string, options: UsePollingOptions): UsePollingResult<T> {
  const { interval, enabled = true } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isVisibleRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    const result = await apiFetch<T>(url)
    if (result.success) {
      setData(result.data)
      setError(null)
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }, [url])

  useEffect(() => {
    if (!enabled) return

    fetchData()

    const startPolling = () => {
      intervalRef.current = setInterval(() => {
        if (isVisibleRef.current) fetchData()
      }, interval)
    }

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden
      if (!document.hidden) {
        fetchData() // Immediate refresh on tab focus
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchData, interval, enabled])

  return { data, error, isLoading, refresh: fetchData }
}
```

- [ ] **Step 2: Create `hooks/useCountdown.ts`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getTimeRemaining, formatTimeRemaining, getUrgency, type UrgencyLevel } from '@/lib/time'

interface CountdownResult {
  display: string
  remaining: number
  minutes: number
  seconds: number
  isOverdue: boolean
  urgency: UrgencyLevel
  urgencyLabel: string
  urgencyColor: string
  urgencyBgClass: string
}

export function useCountdown(dueTime: string): CountdownResult {
  const [result, setResult] = useState<CountdownResult>(() => compute(dueTime))

  useEffect(() => {
    const interval = setInterval(() => setResult(compute(dueTime)), 1000)
    return () => clearInterval(interval)
  }, [dueTime])

  return result
}

function compute(dueTime: string): CountdownResult {
  const time = getTimeRemaining(dueTime)
  const urgency = getUrgency(dueTime)
  return {
    display: formatTimeRemaining(dueTime),
    remaining: time.total,
    minutes: time.minutes,
    seconds: time.seconds,
    isOverdue: time.isOverdue,
    urgency: urgency.level,
    urgencyLabel: urgency.label,
    urgencyColor: urgency.color,
    urgencyBgClass: urgency.bgClass,
  }
}
```

- [ ] **Step 3: Create `hooks/useSettings.ts`**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, DEFAULT_SETTINGS } from '@/lib/types'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

interface UseSettingsResult {
  settings: Settings
  isLoading: boolean
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  saveSettings: () => Promise<boolean>
  resetSettings: () => void
  hasChanges: boolean
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await apiFetch<Settings>('/api/settings')
      if (result.success) {
        const merged = { ...DEFAULT_SETTINGS, ...result.data }
        setSettings(merged)
        setOriginalSettings(merged)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const saveSettings = useCallback(async (): Promise<boolean> => {
    const result = await apiFetch<Settings>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (result.success) {
      setOriginalSettings(settings)
      return true
    }
    toast.error(result.error)
    return false
  }, [settings])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  return { settings, isLoading, updateSetting, saveSettings, resetSettings, hasChanges }
}
```

- [ ] **Step 4: Create `hooks/useBulkSelection.ts`**

```typescript
'use client'

import { useState, useCallback } from 'react'

interface UseBulkSelectionResult<T extends { id: number }> {
  selectedIds: Set<number>
  toggle: (id: number) => void
  selectAll: (items: T[]) => void
  clearAll: () => void
  isAllSelected: (items: T[]) => boolean
  pruneStale: (activeIds: Set<number>) => void
}

export function useBulkSelection<T extends { id: number }>(): UseBulkSelectionResult<T> {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const toggle = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((items: T[]) => {
    setSelectedIds(new Set(items.map(i => i.id)))
  }, [])

  const clearAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isAllSelected = useCallback((items: T[]) => {
    return items.length > 0 && items.every(i => selectedIds.has(i.id))
  }, [selectedIds])

  const pruneStale = useCallback((activeIds: Set<number>) => {
    setSelectedIds(prev => {
      const next = new Set<number>()
      prev.forEach(id => { if (activeIds.has(id)) next.add(id) })
      return next
    })
  }, [])

  return { selectedIds, toggle, selectAll, clearAll, isAllSelected, pruneStale }
}
```

- [ ] **Step 5: Verify build passes**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`

- [ ] **Step 6: Commit**

```bash
git add hooks/
git commit -m "feat: add custom hooks (usePolling, useCountdown, useSettings, useBulkSelection)"
```

---

## Task 3: Shared UI Components

**Files:**
- Create: `components/ErrorBoundary.tsx`
- Create: `components/ConfirmDialog.tsx`
- Create: `components/OrderTypeBadge.tsx`
- Create: `components/TimeDisplay.tsx`
- Create: `components/EmptyState.tsx`

- [ ] **Step 1: Create `components/ErrorBoundary.tsx`**

React class component with error boundary. Renders a centered card with error message, retry button (calls `window.location.reload()`), and "Go Home" link to `/entry`. Catches errors from children. Logs to console.

- [ ] **Step 2: Create `components/ConfirmDialog.tsx`**

Framer Motion animated modal overlay. Props: `isOpen`, `onConfirm`, `onCancel`, `title`, `message`, `confirmLabel`, `isDestructive`. Renders backdrop + centered card with cancel/confirm buttons. Confirm button is red when `isDestructive`. Focus trapped inside. Escape to close. Returns void (callback-based).

- [ ] **Step 3: Create `components/OrderTypeBadge.tsx`**

```typescript
import { cn } from '@/lib/utils'
import { OrderType } from '@/lib/types'
import { memo } from 'react'

const config: Record<OrderType, { label: string; short: string; classes: string }> = {
  waiter: { label: 'WAITER', short: 'W', classes: 'bg-green-100 text-green-700' },
  acute: { label: 'ACUTE', short: 'A', classes: 'bg-blue-100 text-blue-700' },
  urgent_mail: { label: 'URGENT MAIL', short: 'U', classes: 'bg-purple-100 text-purple-700' },
  mail: { label: 'MAIL', short: 'M', classes: 'bg-orange-100 text-orange-700' },
}

interface Props {
  type: OrderType
  short?: boolean
  className?: string
}

export const OrderTypeBadge = memo(function OrderTypeBadge({ type, short = false, className }: Props) {
  const c = config[type] || config.waiter
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-xs font-bold', c.classes, className)}
          aria-label={`Order type: ${c.label}`}>
      {short ? c.short : c.label}
    </span>
  )
})
```

- [ ] **Step 4: Create `components/TimeDisplay.tsx`**

Memoized component that uses `useCountdown` hook. Props: `dueTime`, `showUrgencyBadge?`, `showDueTime?`, `className?`. Renders countdown text with urgency color, optional urgency label badge (for accessibility), and optional due time below.

- [ ] **Step 5: Create `components/EmptyState.tsx`**

Memoized component. Props: `icon` (LucideIcon), `title`, `message`, `action?` ({ label, onClick }). Renders centered dashed-border box with icon, title, message, and optional action button. Uses Framer Motion fade-in.

- [ ] **Step 6: Verify build passes**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`

- [ ] **Step 7: Commit**

```bash
git add components/ErrorBoundary.tsx components/ConfirmDialog.tsx components/OrderTypeBadge.tsx components/TimeDisplay.tsx components/EmptyState.tsx
git commit -m "feat: add shared UI components (ErrorBoundary, ConfirmDialog, OrderTypeBadge, TimeDisplay, EmptyState)"
```

---

## Task 4: API Route Improvements

**Files:**
- Modify: `app/api/records/route.ts`
- Modify: `app/api/records/[id]/route.ts`
- Modify: `app/api/board/patient/route.ts`
- Modify: `app/api/patients/search/route.ts`
- Modify: `app/api/audit/route.ts`
- Modify: `app/api/settings/route.ts` (if exists, otherwise create pattern for consistency)

- [ ] **Step 1: Add validation to POST `/api/records`**

Import `validateRecord`, `sanitizeString` from `lib/validation`. In the POST handler, validate the body. If invalid, return `{ success: false, error: 'Validation failed', fields }` with status 400. Sanitize `comments`, `first_name`, `last_name` before passing to `createRecord`.

- [ ] **Step 2: Add validation to PUT `/api/records/[id]`**

Validate `comments` length, `initials` format, `num_prescriptions` is positive integer. Return 400 with field errors if invalid. Sanitize comment strings.

- [ ] **Step 3: Standardize response shapes across all routes**

All GET routes return the data directly (array or object) for backwards compatibility, but error responses use `{ success: false, error: string }`. This is a minimal change — just ensure error responses are consistent.

- [ ] **Step 4: Verify build passes**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`

- [ ] **Step 5: Commit**

```bash
git add app/api/
git commit -m "feat: add input validation and sanitization to API routes"
```

---

## Task 5: Database Indexes

**Files:**
- Create: `scripts/add-indexes.ts`
- Modify: `lib/db.ts` (add index creation to initializeDatabase)

- [ ] **Step 1: Add indexes to `initializeDatabase` in `lib/db.ts`**

After table creation, add:

```sql
CREATE INDEX IF NOT EXISTS idx_waiter_records_active ON waiter_records(ready, completed);
CREATE INDEX IF NOT EXISTS idx_waiter_records_order_type ON waiter_records(order_type);
CREATE INDEX IF NOT EXISTS idx_waiter_records_due_time ON waiter_records(due_time);
CREATE INDEX IF NOT EXISTS idx_waiter_records_created_at ON waiter_records(created_at);
```

These are safe `IF NOT EXISTS` so they're idempotent.

- [ ] **Step 2: Verify build passes and dev server starts**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts scripts/add-indexes.ts
git commit -m "feat: add database indexes on hot query columns"
```

---

## Task 6: ProductionBoard Decomposition

**Files:**
- Modify: `components/ProductionBoard.tsx` (rewrite as shell)
- Create: `components/production/ActiveOrdersTab.tsx`
- Create: `components/production/CompletedTab.tsx`
- Create: `components/production/MailWorkflow.tsx`
- Create: `components/production/QuickAddModal.tsx`
- Create: `components/production/BulkActions.tsx`
- Create: `components/production/RecordRow.tsx`

- [ ] **Step 1: Create `components/production/RecordRow.tsx`**

Extract the `RecordRow` component (currently lines 739-921 of ProductionBoard.tsx). Use `useCountdown` hook instead of manual interval. Use `OrderTypeBadge` instead of `getTypeBadge`/`getTypeLabel`. Use `ConfirmDialog` for delete. Add ARIA labels on checkboxes. Wrap with `React.memo`.

- [ ] **Step 2: Create `components/production/BulkActions.tsx`**

Extract the bulk selection toolbar (lines 396-424). Props: `selectedCount`, `onBulkPrint`, `onBulkReady`, `onClear`. Animated slide-down bar with count and action buttons. Add `aria-label` on buttons.

- [ ] **Step 3: Create `components/production/QuickAddModal.tsx`**

Extract the quick-add form (lines 426-540). Self-contained form with local state for the form fields. Props: `isOpen`, `onClose`, `onSubmit`. Uses `lib/validation` for form validation. Add `aria-label` attributes.

- [ ] **Step 4: Create `components/production/MailWorkflow.tsx`**

Extract mail queue, completed mail, and mail history sections (lines 596-698). Also extract `MailQueueRow`, `CompletedMailRow`, `MailHistoryRow` inline components into this file. Props: `mailQueue`, `completedMail`, `mailHistory`, `onUpdate`, `onDelete`, `stats`. Use `OrderTypeBadge`.

- [ ] **Step 5: Create `components/production/ActiveOrdersTab.tsx`**

Renders the search bar, filter dropdown, record table with header, and the Reorder.Group of RecordRow components. Props: `records`, `filteredRecords`, `searchQuery`, `onSearchChange`, `filterType`, `onFilterChange`, `selectedIds`, `onToggleSelect`, `onToggleAll`, `onUpdate`, `onDelete`. Uses `EmptyState` for empty view.

- [ ] **Step 6: Create `components/production/CompletedTab.tsx`**

Renders completed records table. Extract `CompletedRecordRow` (lines 1082-1165) into this file. Props: `records`, `onMarkComplete`. Uses `EmptyState`, `OrderTypeBadge`.

- [ ] **Step 7: Rewrite `components/ProductionBoard.tsx` as orchestration shell**

The shell component:
- Uses `usePolling` to fetch all 5 record types (production, completed, mail_queue, completed_mail, mail_history)
- Uses `useBulkSelection` for selection state
- Manages tab state and quick-add modal state
- Renders tab switcher, then delegates to `ActiveOrdersTab`, `CompletedTab`, `MailWorkflow`
- Handles `handleUpdate`, `handleDelete`, `handleBulkAction` callbacks
- Should be ~120-150 lines

- [ ] **Step 8: Verify build passes**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`

- [ ] **Step 9: Commit**

```bash
git add components/ProductionBoard.tsx components/production/
git commit -m "refactor: decompose ProductionBoard into focused sub-components"
```

---

## Task 7: SettingsPanel Decomposition

**Files:**
- Create: `components/settings/settingsConfig.ts`
- Create: `components/settings/SettingField.tsx`
- Modify: `components/SettingsPanel.tsx`

- [ ] **Step 1: Create `components/settings/settingsConfig.ts`**

Declarative config array defining all settings:

```typescript
import { Settings } from '@/lib/types'
import { Clock, Building2, Monitor, Palette, Volume2, Moon } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export type FieldType = 'number' | 'text' | 'textarea' | 'select' | 'toggle'

export interface SettingFieldConfig {
  key: keyof Settings
  label: string
  description?: string
  type: FieldType
  min?: number
  max?: number
  placeholder?: string
  options?: { value: string; label: string }[]
}

export interface SettingSectionConfig {
  title: string
  description: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  fields: SettingFieldConfig[]
}

export const settingsSections: SettingSectionConfig[] = [
  {
    title: 'Timing Settings',
    description: 'Configure order due times',
    icon: Clock,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    fields: [
      { key: 'waiter_due_minutes', label: 'Waiter Due Time (minutes)', type: 'number', min: 5, max: 120 },
      { key: 'acute_due_minutes', label: 'Acute Due Time (minutes)', type: 'number', min: 5, max: 240 },
      { key: 'urgent_due_minutes', label: 'Urgent Mail Due Time (minutes)', type: 'number', min: 5, max: 240 },
      { key: 'auto_clear_minutes', label: 'Auto-Clear Time (minutes)', description: 'How long after "Ready" before removal', type: 'number', min: 5, max: 180 },
    ],
  },
  {
    title: 'Pharmacy Information',
    description: 'Your pharmacy details',
    icon: Building2,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    fields: [
      { key: 'pharmacy_name', label: 'Pharmacy Name', type: 'text', placeholder: 'Community Pharmacy' },
      { key: 'display_name', label: 'Display Name', type: 'text', placeholder: 'Pharmacy Waiter Board' },
    ],
  },
  {
    title: 'Patient Board Settings',
    description: 'Customize the public display',
    icon: Monitor,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    fields: [
      { key: 'patient_board_message', label: 'Ready Message', type: 'textarea', placeholder: 'Your order is ready...' },
      { key: 'display_font_size', label: 'Display Font Size', type: 'select', options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'extra-large', label: 'Extra Large' },
      ]},
      { key: 'patient_board_refresh_rate', label: 'Refresh Rate (seconds)', type: 'number', min: 5, max: 60 },
    ],
  },
  {
    title: 'Display Settings',
    description: 'Visual preferences',
    icon: Palette,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    fields: [
      { key: 'dark_mode', label: 'Dark Mode', description: 'Enable dark mode for patient board', type: 'toggle' },
      { key: 'sound_notifications', label: 'Sound Notifications', description: 'Play sound when new orders are ready', type: 'toggle' },
    ],
  },
]
```

- [ ] **Step 2: Create `components/settings/SettingField.tsx`**

Generic renderer for one setting. Props: `config: SettingFieldConfig`, `value: Settings[keyof Settings]`, `onChange: (value: any) => void`. Renders the appropriate input type (number input, text input, textarea, select, toggle switch). Toggle uses the existing Framer Motion animated switch pattern. Wrap with `React.memo`.

- [ ] **Step 3: Rewrite `components/SettingsPanel.tsx`**

Use `useSettings` hook for state management. Map over `settingsSections` to render sections, within each section map over `fields` to render `SettingField` components. Keep the sidebar preview and quick stats. Keep import/export/reset functionality. Use `ConfirmDialog` for reset confirmation instead of `confirm()`. Should be ~150-180 lines.

- [ ] **Step 4: Verify build passes**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`

- [ ] **Step 5: Commit**

```bash
git add components/SettingsPanel.tsx components/settings/
git commit -m "refactor: decompose SettingsPanel with declarative config and reusable SettingField"
```

---

## Task 8: Refactor PatientBoard and RecordCard

**Files:**
- Modify: `components/PatientBoard.tsx`
- Modify: `components/RecordCard.tsx`

- [ ] **Step 1: Refactor `components/PatientBoard.tsx` to use `usePolling`**

Replace the manual `fetch` + `setInterval` + `useEffect` pattern with `usePolling` for both `/api/board/patient` and `/api/settings`. The `usePolling` hook already handles pause-on-hidden-tab. Keep the new-order detection logic (comparing prev vs new record IDs) and sound notification. Add `aria-live="polite"` on the records grid region.

- [ ] **Step 2: Refactor `components/RecordCard.tsx` to use shared components**

Replace inline urgency calculation with `useCountdown` hook. Replace inline order type badge with `OrderTypeBadge` component. Replace inline progress calculation with `getProgressPercentage` and `getProgressColor` from `lib/time.ts`. Add `aria-label` on Printed/Ready checkboxes and Delete button. Wrap with `React.memo`.

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`

- [ ] **Step 4: Commit**

```bash
git add components/PatientBoard.tsx components/RecordCard.tsx
git commit -m "refactor: wire PatientBoard and RecordCard to use shared hooks and components"
```

---

## Task 9: Accessibility Pass

**Files:**
- Modify: `components/Navigation.tsx`
- Modify: `components/WaiterForm.tsx`
- Modify: `components/MRNSearch.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add ARIA roles to Navigation**

Add `role="navigation"` and `aria-label="Main navigation"` to the nav element. Add `aria-current="page"` to the active nav link. Add `aria-expanded` and `aria-controls` to the mobile menu toggle. Add `aria-label` on the mobile menu button.

- [ ] **Step 2: Add ARIA labels to WaiterForm**

Add `aria-label` on the prescription counter buttons ("-" and "+"). Add `aria-describedby` linking order type buttons to their description. Add `role="group"` and `aria-label="Order type"` on the order type button container.

- [ ] **Step 3: Add ARIA labels to MRNSearch**

Add `aria-label="Search by MRN"` on the input. Add `aria-live="polite"` on the status region (found/not-found messages). Add `aria-label` on the clear button.

- [ ] **Step 4: Wrap pages with ErrorBoundary in `app/layout.tsx`**

Import ErrorBoundary and wrap the `{children}` in layout.tsx.

- [ ] **Step 5: Verify build passes**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`

- [ ] **Step 6: Commit**

```bash
git add components/Navigation.tsx components/WaiterForm.tsx components/MRNSearch.tsx app/layout.tsx
git commit -m "feat: comprehensive accessibility pass with ARIA labels, roles, and error boundaries"
```

---

## Task 10: Performance Pass

**Files:**
- Modify: various components (add memo, useCallback, useMemo)
- Modify: `components/PatientBoard.tsx` (already uses usePolling for smart polling)

- [ ] **Step 1: Add React.memo to leaf components**

Wrap these with `React.memo`: `OrderTypeBadge` (already done), `TimeDisplay`, `EmptyState`, `SettingField`, `RecordRow`, `MailQueueRow`, `CompletedMailRow`, `MailHistoryRow`, `CompletedRecordRow`, `BulkActions`.

- [ ] **Step 2: Add useMemo/useCallback in ProductionBoard shell**

Ensure `handleUpdate`, `handleDelete`, `handleBulkAction` are wrapped in `useCallback`. The `filteredRecords` and `stats` computations should use `useMemo` (already done in current code, verify they survive the refactor).

- [ ] **Step 3: Add debounce to ProductionBoard search**

In `ActiveOrdersTab`, debounce the search input with 300ms delay using lodash debounce (already a dependency). The `searchQuery` state stays in ProductionBoard shell, but the input onChange calls a debounced setter.

- [ ] **Step 4: Verify build passes**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`

- [ ] **Step 5: Commit**

```bash
git add components/
git commit -m "perf: add React.memo, useCallback, useMemo, and debounced search"
```

---

## Task 11: Final Integration & Cleanup

**Files:**
- Remove: unused imports across all modified files
- Verify: all existing functionality works

- [ ] **Step 1: Run full build**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run build`
Fix any remaining type errors or import issues.

- [ ] **Step 2: Start dev server and smoke test**

Run: `cd /Users/neima/Desktop/Apps/PharmacyWaiterBoard && npm run dev`
Verify: Entry page loads, production board loads, patient board loads, settings page loads.

- [ ] **Step 3: Clean up any leftover debug logs**

Search for `console.log` in lib/ and components/ directories. Remove any that aren't in catch blocks.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and integration verification"
```
