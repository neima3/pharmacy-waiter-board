import type { AuditLog, WaiterRecord } from './types'
import type { WorkflowEventRow } from './db'
import type { WorkflowEventType } from './workflow-events'

export const HISTORY_LIMIT_DEFAULT = 100
export const HISTORY_LIMIT_MAX = 500

export type HistoryAuditRow = Omit<AuditLog, 'old_values' | 'new_values' | 'staff_initials'> & {
  old_values: string | null
  new_values: string | null
  staff_initials: string | null
}

export interface HistoryQuery {
  limit: number
  recordId: number | null
  action: string | null
  eventType: WorkflowEventType | null
}

export interface HistoryEnvelopeMeta {
  limit: number
  count: number
  has_more: boolean
  filters: {
    record_id: number | null
    action: string | null
    event_type: WorkflowEventType | null
  }
}

export interface HistoryEnvelope<T> {
  items: T[]
  meta: HistoryEnvelopeMeta
}

export interface EnrichedAuditLog extends HistoryAuditRow {
  workflow_event: WorkflowEventRow | null
}

export interface RecordHistoryEnvelope<T> {
  record: WaiterRecord
  history: HistoryEnvelope<T>
}

const WORKFLOW_EVENT_TYPES: WorkflowEventType[] = ['create', 'update', 'advance', 'archive', 'expiration']

function parseInteger(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function normalizeHistoryLimit(value: string | null, fallback = HISTORY_LIMIT_DEFAULT): number {
  const parsed = parseInteger(value)
  if (parsed === null) return fallback
  return Math.min(parsed, HISTORY_LIMIT_MAX)
}

export function normalizeHistoryAction(value: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.toUpperCase()
}

export function normalizeHistoryEventType(value: string | null): WorkflowEventType | null {
  const trimmed = value?.trim().toLowerCase()
  if (!trimmed) return null
  return WORKFLOW_EVENT_TYPES.includes(trimmed as WorkflowEventType) ? (trimmed as WorkflowEventType) : null
}

export function parseHistoryQuery(
  searchParams: URLSearchParams,
  options: { allowRecordId?: boolean; fallbackLimit?: number } = {},
): HistoryQuery {
  return {
    limit: normalizeHistoryLimit(searchParams.get('limit'), options.fallbackLimit ?? HISTORY_LIMIT_DEFAULT),
    recordId: options.allowRecordId ? parseInteger(searchParams.get('recordId')) : null,
    action: normalizeHistoryAction(searchParams.get('action')),
    eventType: normalizeHistoryEventType(searchParams.get('eventType')),
  }
}

function buildWorkflowEventLookup(workflowEvents: WorkflowEventRow[]): Map<string, WorkflowEventRow[]> {
  const lookup = new Map<string, WorkflowEventRow[]>()

  for (const event of [...workflowEvents].sort((left, right) => right.id - left.id)) {
    const key = `${event.record_id}:${event.event_type}`
    const existing = lookup.get(key)
    if (existing) {
      existing.push(event)
    } else {
      lookup.set(key, [event])
    }
  }

  return lookup
}

export function enrichAuditHistoryRows(
  auditRows: HistoryAuditRow[],
  workflowEvents: WorkflowEventRow[],
): EnrichedAuditLog[] {
  const workflowEventLookup = buildWorkflowEventLookup(workflowEvents)

  return auditRows.map((row) => {
    const eventType = normalizeHistoryAction(row.action)?.toLowerCase()
    const key = eventType ? `${row.record_id}:${eventType}` : null
    const workflowEvent = key ? workflowEventLookup.get(key)?.shift() ?? null : null

    return {
      ...row,
      workflow_event: workflowEvent,
    }
  })
}

export function filterEnrichedAuditHistoryRows(
  rows: EnrichedAuditLog[],
  query: HistoryQuery,
): EnrichedAuditLog[] {
  if (!query.eventType) return rows
  return rows.filter((row) => row.workflow_event?.event_type === query.eventType)
}

export function buildHistoryEnvelope<T>(
  items: T[],
  query: HistoryQuery,
): HistoryEnvelope<T> {
  return {
    items,
    meta: {
      limit: query.limit,
      count: items.length,
      has_more: items.length >= query.limit,
      filters: {
        record_id: query.recordId,
        action: query.action,
        event_type: query.eventType,
      },
    },
  }
}

export function buildAuditHistoryPayload({
  auditRows,
  workflowEvents,
  query,
}: {
  auditRows: HistoryAuditRow[]
  workflowEvents: WorkflowEventRow[]
  query: HistoryQuery
}): HistoryEnvelope<EnrichedAuditLog> {
  const enrichedRows = enrichAuditHistoryRows(auditRows, workflowEvents)
  const filteredRows = filterEnrichedAuditHistoryRows(enrichedRows, query)
  return buildHistoryEnvelope(filteredRows, query)
}

export function buildRecordHistoryPayload({
  record,
  auditRows,
  workflowEvents,
  query,
}: {
  record: WaiterRecord
  auditRows: HistoryAuditRow[]
  workflowEvents: WorkflowEventRow[]
  query: HistoryQuery
}): RecordHistoryEnvelope<EnrichedAuditLog> {
  const recordQuery: HistoryQuery = {
    ...query,
    recordId: record.id,
  }

  return {
    record,
    history: buildAuditHistoryPayload({
      auditRows,
      workflowEvents,
      query: recordQuery,
    }),
  }
}
