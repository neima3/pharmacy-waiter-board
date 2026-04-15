import { calculateDueTime } from './utils'
import { DEFAULT_ACTIVE_LOCATION } from './launch-context'
import { buildQueueRecordResponse, type QueueRecordResponse } from './queue-contract'
import { sanitizeString, validateComments, validateInitials, validateMRN, validateName, validateOrderType } from './validation'
import type { OrderType, WaiterRecord } from './types'

export const EXTERNAL_INTAKE_SOURCE_APPS = ['PharmCall', 'PatientWorkflow'] as const
export type ExternalIntakeSourceApp = (typeof EXTERNAL_INTAKE_SOURCE_APPS)[number]
export type ExternalIntakeEventType = 'create' | 'update'

export interface NormalizedExternalIntakeRequest {
  idempotency_key: string
  event_type: ExternalIntakeEventType
  source_app: ExternalIntakeSourceApp
  source_record_id: number
  patient_id: number | null
  mrn: string
  patient_name: string
  first_name: string
  last_name: string
  dob: string
  num_prescriptions: number
  comments: string
  initials: string
  order_type: OrderType
  active_location_id: string
  active_location_name: string
  printed?: boolean
  ready?: boolean
  completed?: boolean
  moved_to_mail?: boolean
  mailed?: boolean
}

export interface ExternalIntakeLedgerRow {
  id: number
  source_app: string
  idempotency_key: string
  source_record_id: number
  source_event_type: ExternalIntakeEventType
  status: 'processing' | 'completed' | 'failed'
  record_id: number | null
  response_status: number | null
  request_payload: string
  response_payload: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface ExternalIntakeRepository {
  getIntakeEvent(sourceApp: string, idempotencyKey: string): Promise<ExternalIntakeLedgerRow | null>
  claimIntakeEvent(input: {
    source_app: string
    idempotency_key: string
    source_event_type: ExternalIntakeEventType
    source_record_id: number
    request_payload: string
  }): Promise<ExternalIntakeLedgerRow | null>
  completeIntakeEvent(
    id: number,
    result: {
      record_id: number
      response_status: number
      response_payload: string
    },
  ): Promise<void>
  failIntakeEvent(
    id: number,
    result: {
      response_status: number
      error_message: string
    },
  ): Promise<void>
  getRecordBySourceIdentity(sourceApp: string, sourceRecordId: number): Promise<WaiterRecord | null>
  createRecord(input: {
    mrn: string
    patient_id?: number | null
    patient_name?: string
    first_name: string
    last_name: string
    dob: string
    num_prescriptions: number
    comments: string
    initials: string
    order_type: OrderType
    due_time: string
    active_location_id?: string
    active_location_name?: string
    source_app?: string
    source_record_id?: number | null
  }): Promise<WaiterRecord>
  updateRecord(
    id: number,
    updates: {
      comments?: string
      initials?: string
      num_prescriptions?: number
      printed?: boolean
      ready?: boolean
      completed?: boolean
      moved_to_mail?: boolean
      mailed?: boolean
    },
    staffInitials?: string,
  ): Promise<WaiterRecord | null>
}

export type ExternalIntakeSuccess = {
  valid: true
  payload: NormalizedExternalIntakeRequest
}

export type ExternalIntakeFailure = {
  valid: false
  fields: Record<string, string>
}

export type ExternalIntakeValidationResult = ExternalIntakeSuccess | ExternalIntakeFailure

export type ExternalIntakeResult =
  | {
      status: number
      body: QueueRecordResponse
    }
  | {
      status: number
      body: { error: string; fields?: Record<string, string> }
    }

function readString(input: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

function readNumber(input: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function readBoolean(input: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'boolean') return value
    if (typeof value === 'number' && (value === 0 || value === 1)) return value === 1
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true' || normalized === '1') return true
      if (normalized === 'false' || normalized === '0') return false
    }
  }
  return undefined
}

function readEventType(input: Record<string, unknown>): ExternalIntakeEventType {
  const raw = readString(input, ['event_type', 'eventType'])?.toLowerCase()
  return raw === 'update' ? 'update' : 'create'
}

function buildMutableUpdatePayload(payload: NormalizedExternalIntakeRequest): {
  comments: string
  initials: string
  num_prescriptions: number
  printed?: boolean
  ready?: boolean
  completed?: boolean
  moved_to_mail?: boolean
  mailed?: boolean
} {
  const updates: {
    comments: string
    initials: string
    num_prescriptions: number
    printed?: boolean
    ready?: boolean
    completed?: boolean
    moved_to_mail?: boolean
    mailed?: boolean
  } = {
    comments: payload.comments,
    initials: payload.initials,
    num_prescriptions: payload.num_prescriptions,
  }

  if (payload.printed !== undefined) updates.printed = payload.printed
  if (payload.ready !== undefined) updates.ready = payload.ready
  if (payload.completed !== undefined) updates.completed = payload.completed
  if (payload.moved_to_mail !== undefined) updates.moved_to_mail = payload.moved_to_mail
  if (payload.mailed !== undefined) updates.mailed = payload.mailed

  return updates
}

function hasMutableChanges(existing: WaiterRecord, payload: NormalizedExternalIntakeRequest): boolean {
  const requested = buildMutableUpdatePayload(payload)
  if (existing.comments !== requested.comments) return true
  if (existing.initials !== requested.initials) return true
  if (existing.num_prescriptions !== requested.num_prescriptions) return true
  if (requested.printed !== undefined && existing.printed !== requested.printed) return true
  if (requested.ready !== undefined && existing.ready !== requested.ready) return true
  if (requested.completed !== undefined && existing.completed !== requested.completed) return true
  if (requested.moved_to_mail !== undefined && existing.moved_to_mail !== requested.moved_to_mail) return true
  if (requested.mailed !== undefined && existing.mailed !== requested.mailed) return true
  return false
}

export function normalizeExternalIntakeRequest(input: Record<string, unknown>): ExternalIntakeValidationResult {
  const fields: Record<string, string> = {}

  const idempotencyKey = readString(input, ['idempotency_key', 'idempotencyKey'])
  if (!idempotencyKey) {
    fields.idempotency_key = 'Idempotency key is required'
  } else if (idempotencyKey.length > 128) {
    fields.idempotency_key = 'Idempotency key must be 128 characters or less'
  }

  const rawSourceApp = readString(input, ['source_app', 'sourceApp'])
  if (!rawSourceApp) {
    fields.source_app = 'Source app is required'
  } else if (!EXTERNAL_INTAKE_SOURCE_APPS.includes(rawSourceApp as ExternalIntakeSourceApp)) {
    fields.source_app = 'Source app must be PharmCall or PatientWorkflow'
  }

  const sourceRecordId = readNumber(input, ['source_record_id', 'sourceRecordId'])
  if (!sourceRecordId || !Number.isInteger(sourceRecordId) || sourceRecordId < 1) {
    fields.source_record_id = 'Source record id must be a positive integer'
  }

  const mrnResult = validateMRN(String(input.mrn || ''))
  if (!mrnResult.valid) fields.mrn = mrnResult.message

  const firstNameResult = validateName(String(input.first_name || ''), 'First name')
  if (!firstNameResult.valid) fields.first_name = firstNameResult.message

  const lastNameResult = validateName(String(input.last_name || ''), 'Last name')
  if (!lastNameResult.valid) fields.last_name = lastNameResult.message

  const initialsResult = validateInitials(String(input.initials || ''))
  if (!initialsResult.valid) fields.initials = initialsResult.message

  const orderTypeResult = validateOrderType(String(input.order_type || 'waiter'))
  if (!orderTypeResult.valid) fields.order_type = orderTypeResult.message

  const commentsResult = validateComments(String(input.comments || ''))
  if (!commentsResult.valid) fields.comments = commentsResult.message

  const patientId = readNumber(input, ['patient_id', 'patientId'])
  if (patientId !== undefined && (!Number.isInteger(patientId) || patientId < 1)) {
    fields.patient_id = 'Patient ID must be a positive integer'
  }

  const numPrescriptions = readNumber(input, ['num_prescriptions', 'numPrescriptions']) ?? 1
  if (!Number.isInteger(numPrescriptions) || numPrescriptions < 1) {
    fields.num_prescriptions = 'Number of prescriptions must be a positive integer'
  }

  const eventType = readEventType(input)
  const activeLocationId = readString(input, ['active_location_id', 'activeLocationId']) ?? DEFAULT_ACTIVE_LOCATION.id
  const activeLocationName = readString(input, ['active_location_name', 'activeLocationName']) ?? DEFAULT_ACTIVE_LOCATION.name

  if (Object.keys(fields).length > 0) {
    return { valid: false, fields }
  }

  const firstName = sanitizeString(String(input.first_name).trim())
  const lastName = sanitizeString(String(input.last_name).trim())
  const normalizedIdempotencyKey = sanitizeString(idempotencyKey!)
  const patientName = sanitizeString(
    readString(input, ['patient_name', 'patientName']) ?? `${firstName} ${lastName}`.trim(),
  )

  return {
    valid: true,
    payload: {
      idempotency_key: normalizedIdempotencyKey,
      event_type: eventType,
      source_app: rawSourceApp as ExternalIntakeSourceApp,
      source_record_id: sourceRecordId as number,
      patient_id: patientId ?? null,
      mrn: sanitizeString(String(input.mrn || '').trim()),
      patient_name: patientName,
      first_name: firstName,
      last_name: lastName,
      dob: sanitizeString(String(input.dob || '').trim()),
      num_prescriptions: numPrescriptions,
      comments: sanitizeString(String(input.comments || '')),
      initials: sanitizeString(String(input.initials || '').trim()),
      order_type: String(input.order_type || 'waiter') as OrderType,
      active_location_id: sanitizeString(activeLocationId),
      active_location_name: sanitizeString(activeLocationName),
      printed: readBoolean(input, ['printed']),
      ready: readBoolean(input, ['ready']),
      completed: readBoolean(input, ['completed']),
      moved_to_mail: readBoolean(input, ['moved_to_mail']),
      mailed: readBoolean(input, ['mailed']),
    },
  }
}

export async function ingestExternalIntakeRequest(
  input: Record<string, unknown>,
  repository: ExternalIntakeRepository,
): Promise<ExternalIntakeResult> {
  const normalized = normalizeExternalIntakeRequest(input)
  if (!normalized.valid) {
    return {
      status: 400,
      body: {
        error: 'Validation failed',
        fields: normalized.fields,
      },
    }
  }

  const payload = normalized.payload
  const existingEvent = await repository.getIntakeEvent(payload.source_app, payload.idempotency_key)
  if (existingEvent) {
    if (existingEvent.status === 'processing') {
      return {
        status: 409,
        body: { error: 'Intake event is still processing' },
      }
    }

    if (existingEvent.status === 'failed') {
      return {
        status: existingEvent.response_status ?? 500,
        body: {
          error: existingEvent.error_message ?? 'Intake event failed',
        },
      }
    }

    if (existingEvent.response_payload) {
      return {
        status: existingEvent.response_status ?? 200,
        body: JSON.parse(existingEvent.response_payload) as QueueRecordResponse,
      }
    }
  }

  const claimedEvent = await repository.claimIntakeEvent({
    source_app: payload.source_app,
    idempotency_key: payload.idempotency_key,
    source_event_type: payload.event_type,
    source_record_id: payload.source_record_id,
    request_payload: JSON.stringify(payload),
  })

  if (!claimedEvent) {
    const replay = await repository.getIntakeEvent(payload.source_app, payload.idempotency_key)
    if (replay?.response_payload) {
      return {
        status: replay.response_status ?? 200,
        body: JSON.parse(replay.response_payload) as QueueRecordResponse,
      }
    }
    return {
      status: 409,
      body: { error: 'Intake event is already in progress' },
    }
  }

  const existingRecord = await repository.getRecordBySourceIdentity(payload.source_app, payload.source_record_id)

  try {
    const record = existingRecord
      ? (hasMutableChanges(existingRecord, payload)
          ? await repository.updateRecord(
              existingRecord.id,
              buildMutableUpdatePayload(payload),
              payload.initials,
            )
          : existingRecord)
      : await repository.createRecord({
          mrn: payload.mrn,
          patient_id: payload.patient_id,
          patient_name: payload.patient_name,
          first_name: payload.first_name,
          last_name: payload.last_name,
          dob: payload.dob,
          num_prescriptions: payload.num_prescriptions,
          comments: payload.comments,
          initials: payload.initials,
          order_type: payload.order_type,
          due_time: calculateDueTime(payload.order_type),
          active_location_id: payload.active_location_id,
          active_location_name: payload.active_location_name,
          source_app: payload.source_app,
          source_record_id: payload.source_record_id,
        })

    if (!record) {
      throw new Error('Unable to persist external intake record')
    }

    const response = buildQueueRecordResponse(record)
    await repository.completeIntakeEvent(claimedEvent.id, {
      record_id: record.id,
      response_status: existingRecord ? 200 : 201,
      response_payload: JSON.stringify(response),
    })

    return {
      status: existingRecord ? 200 : 201,
      body: response,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to ingest external event'
    await repository.failIntakeEvent(claimedEvent.id, {
      response_status: 500,
      error_message: message,
    })
    return {
      status: 500,
      body: { error: 'Failed to ingest external event' },
    }
  }
}
