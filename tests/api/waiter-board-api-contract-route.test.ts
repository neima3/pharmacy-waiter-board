import test from 'node:test'
import assert from 'node:assert/strict'

import { GET } from '../../app/api/v1/contracts/route'
import { WAITER_BOARD_API_SURFACE_CONTRACT_VERSION } from '../../lib/waiter-board-api-surface-contract'

test('GET /api/v1/contracts exposes the linked-app surface manifest with no-store caching', async () => {
  const response = await GET()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate')

  const payload = await response.json() as {
    contract_version: string
    app: string
    surface: string
    resources: Array<{ path: string }>
  }

  assert.equal(payload.contract_version, WAITER_BOARD_API_SURFACE_CONTRACT_VERSION)
  assert.equal(payload.app, 'PharmacyWaiterBoard')
  assert.equal(payload.surface, 'linked-app-api')
  assert.deepEqual(payload.resources.map((resource) => resource.path), [
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
  ])
})
