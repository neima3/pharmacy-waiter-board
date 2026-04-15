import test from 'node:test'
import assert from 'node:assert/strict'

import {
  WAITER_BOARD_API_SURFACE_CONTRACT_VERSION,
  buildWaiterBoardApiSurface,
  parseWaiterBoardApiSurface,
} from '../lib/waiter-board-api-surface-contract'

test('builds the bounded Waiter Board API surface manifest', () => {
  const manifest = buildWaiterBoardApiSurface()

  assert.equal(manifest.contract_version, WAITER_BOARD_API_SURFACE_CONTRACT_VERSION)
  assert.equal(manifest.app, 'PharmacyWaiterBoard')
  assert.equal(manifest.surface, 'linked-app-api')
  assert.equal(manifest.resources.length, 10)
  assert.deepEqual(
    manifest.resources.map((resource) => resource.path),
    [
      '/api/health',
      '/api/records',
      '/api/records/:id',
      '/api/records/:id/history',
      '/api/events',
      '/api/audit',
      '/api/patients/search',
      '/api/board/patient',
      '/api/reporting/kpis',
      '/api/reports/operations',
    ],
  )
  assert.deepEqual(
    manifest.resources.map((resource) => resource.method),
    ['GET', 'GET', 'GET', 'GET', 'GET', 'GET', 'GET', 'GET', 'GET', 'GET'],
  )
  assert.deepEqual(
    manifest.resources.map((resource) => resource.response),
    [
      'HealthStatus',
      'QueueRecordResponse[]',
      'QueueRecordResponse',
      'RecordHistoryEnvelope<EnrichedAuditLog>',
      'ReadableStream<string> | text/event-stream',
      'HistoryEnvelope<EnrichedAuditLog>',
      '{ found: boolean; patient?: Patient }',
      'QueueRecordResponse[]',
      'KpiSnapshot',
      'OperationsReportSnapshot',
    ],
  )
})

test('parses a valid Waiter Board API surface manifest', () => {
  const manifest = buildWaiterBoardApiSurface()

  assert.deepEqual(parseWaiterBoardApiSurface(manifest), manifest)
})

test('rejects malformed contract payloads', () => {
  assert.equal(parseWaiterBoardApiSurface({ contract_version: '2026-04-15', resources: [{}] }), null)
})
