export const WAITER_BOARD_API_SURFACE_CONTRACT_VERSION = '2026-04-15'

type WaiterBoardApiSurfaceMethod = 'GET'
type WaiterBoardApiSurfaceStatus = 'implemented'

export interface WaiterBoardApiSurfaceResource {
  name: string
  path: string
  method: WaiterBoardApiSurfaceMethod
  status: WaiterBoardApiSurfaceStatus
  response: string
  description: string
  contract_version: string
}

export interface WaiterBoardApiSurface {
  contract_version: string
  generated_at: string
  app: 'PharmacyWaiterBoard'
  surface: 'linked-app-api'
  resources: WaiterBoardApiSurfaceResource[]
}

function hasRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isImplementedGetResource(value: unknown): value is WaiterBoardApiSurfaceResource {
  if (!hasRecord(value)) {
    return false
  }

  return (
    typeof value.name === 'string' &&
    typeof value.path === 'string' &&
    value.method === 'GET' &&
    value.status === 'implemented' &&
    typeof value.response === 'string' &&
    typeof value.description === 'string' &&
    typeof value.contract_version === 'string'
  )
}

const WAITER_BOARD_API_RESOURCES: Omit<WaiterBoardApiSurfaceResource, 'contract_version'>[] = [
  {
    name: 'health',
    path: '/api/health',
    method: 'GET',
    status: 'implemented',
    response: 'HealthStatus',
    description: 'Integrated and standalone readiness snapshot.',
  },
  {
    name: 'records',
    path: '/api/records',
    method: 'GET',
    status: 'implemented',
    response: 'QueueRecordResponse[]',
    description: 'Queued, completed, mail, and history record collections.',
  },
  {
    name: 'record',
    path: '/api/records/:id',
    method: 'GET',
    status: 'implemented',
    response: 'QueueRecordResponse',
    description: 'Single queue record lookup by numeric id.',
  },
  {
    name: 'record-history',
    path: '/api/records/:id/history',
    method: 'GET',
    status: 'implemented',
    response: 'RecordHistoryEnvelope<EnrichedAuditLog>',
    description: 'Per-record audit and workflow history envelope.',
  },
  {
    name: 'events',
    path: '/api/events',
    method: 'GET',
    status: 'implemented',
    response: 'ReadableStream<string> | text/event-stream',
    description: 'Workflow event stream for realtime queue updates.',
  },
  {
    name: 'audit',
    path: '/api/audit',
    method: 'GET',
    status: 'implemented',
    response: 'HistoryEnvelope<EnrichedAuditLog>',
    description: 'Operations audit history feed.',
  },
  {
    name: 'patient-search',
    path: '/api/patients/search',
    method: 'GET',
    status: 'implemented',
    response: '{ found: boolean; patient?: Patient }',
    description: 'MRN search for patient handoff and queue enrichment.',
  },
  {
    name: 'board-patient',
    path: '/api/board/patient',
    method: 'GET',
    status: 'implemented',
    response: 'QueueRecordResponse[]',
    description: 'Ready board lookup used by the patient board view.',
  },
  {
    name: 'reporting-kpis',
    path: '/api/reporting/kpis',
    method: 'GET',
    status: 'implemented',
    response: 'KpiSnapshot',
    description: 'Operational KPI snapshot for waiter board reporting.',
  },
  {
    name: 'reporting-operations',
    path: '/api/reports/operations',
    method: 'GET',
    status: 'implemented',
    response: 'OperationsReportSnapshot',
    description: 'Operations report snapshot for admin and shell consumers.',
  },
]

export function buildWaiterBoardApiSurface(now = new Date()): WaiterBoardApiSurface {
  return {
    contract_version: WAITER_BOARD_API_SURFACE_CONTRACT_VERSION,
    generated_at: now.toISOString(),
    app: 'PharmacyWaiterBoard',
    surface: 'linked-app-api',
    resources: WAITER_BOARD_API_RESOURCES.map((resource) => ({
      ...resource,
      contract_version: WAITER_BOARD_API_SURFACE_CONTRACT_VERSION,
    })),
  }
}

export function parseWaiterBoardApiSurface(payload: unknown): WaiterBoardApiSurface | null {
  const body = hasRecord(payload) && hasRecord(payload.data) ? payload.data : payload
  if (!hasRecord(body)) {
    return null
  }

  if (
    body.contract_version !== WAITER_BOARD_API_SURFACE_CONTRACT_VERSION ||
    typeof body.generated_at !== 'string' ||
    body.app !== 'PharmacyWaiterBoard' ||
    body.surface !== 'linked-app-api' ||
    !Array.isArray(body.resources)
  ) {
    return null
  }

  if (!body.resources.every(isImplementedGetResource)) {
    return null
  }

  if (body.resources.length !== WAITER_BOARD_API_RESOURCES.length) {
    return null
  }

  return {
    contract_version: body.contract_version,
    generated_at: body.generated_at,
    app: body.app,
    surface: body.surface,
    resources: body.resources.map((resource) => ({
      name: resource.name,
      path: resource.path,
      method: resource.method,
      status: resource.status,
      response: resource.response,
      description: resource.description,
      contract_version: resource.contract_version,
    })),
  }
}
