import { buildKpiSnapshot, type KpiSnapshot } from './reporting-kpis'
import type { WaiterRecord } from './types'

export interface OperationsReportSnapshot {
  generated_at: string
  total_records: number
  average_wait_minutes: number | null
  ready_to_pickup_latency_minutes: number | null
  mail_conversion: KpiSnapshot['mail_conversion']
  overdue_queue_count: number
  no_show_count: number
}

export type OperationsQueueRecord = WaiterRecord & {
  no_show?: boolean | number | string | null
  no_show_at?: string | null
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 't'
}

export function isOperationsRecordLike(value: unknown): value is OperationsQueueRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>

  return (
    typeof record.id === 'number' &&
    typeof record.order_type === 'string' &&
    typeof record.due_time === 'string' &&
    typeof record.created_at === 'string' &&
    typeof record.ready === 'boolean' &&
    typeof record.completed === 'boolean' &&
    typeof record.moved_to_mail === 'boolean' &&
    typeof record.mailed === 'boolean' &&
    (record.ready_at === null || typeof record.ready_at === 'string' || record.ready_at === undefined) &&
    (record.no_show === undefined ||
      record.no_show === null ||
      typeof record.no_show === 'boolean' ||
      typeof record.no_show === 'number' ||
      typeof record.no_show === 'string') &&
    (record.no_show_at === undefined || record.no_show_at === null || typeof record.no_show_at === 'string')
  )
}

function countNoShows(records: OperationsQueueRecord[]): number {
  return records.reduce((count, record) => count + (isTruthyFlag(record.no_show) ? 1 : 0), 0)
}

export function buildOperationsReportSnapshot(
  records: unknown[],
  now = new Date(),
): OperationsReportSnapshot {
  const normalizedRecords = records.filter(isOperationsRecordLike)
  const kpis = buildKpiSnapshot(normalizedRecords, now)

  return {
    generated_at: kpis.generated_at,
    total_records: kpis.total_records,
    average_wait_minutes: kpis.average_wait_minutes,
    ready_to_pickup_latency_minutes: kpis.ready_to_pickup_latency_minutes,
    mail_conversion: kpis.mail_conversion,
    overdue_queue_count: kpis.overdue_queue_slices.total,
    no_show_count: countNoShows(normalizedRecords),
  }
}

export function isOperationsReportSnapshot(value: unknown): value is OperationsReportSnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as Record<string, unknown>

  return (
    typeof snapshot.generated_at === 'string' &&
    typeof snapshot.total_records === 'number' &&
    (snapshot.average_wait_minutes === null || typeof snapshot.average_wait_minutes === 'number') &&
    (snapshot.ready_to_pickup_latency_minutes === null ||
      typeof snapshot.ready_to_pickup_latency_minutes === 'number') &&
    typeof snapshot.mail_conversion === 'object' &&
    snapshot.mail_conversion !== null &&
    typeof (snapshot.mail_conversion as Record<string, unknown>).eligible_records === 'number' &&
    typeof (snapshot.mail_conversion as Record<string, unknown>).mailed_records === 'number' &&
    (
      (snapshot.mail_conversion as Record<string, unknown>).rate === null ||
      typeof (snapshot.mail_conversion as Record<string, unknown>).rate === 'number'
    ) &&
    typeof snapshot.overdue_queue_count === 'number' &&
    typeof snapshot.no_show_count === 'number'
  )
}
