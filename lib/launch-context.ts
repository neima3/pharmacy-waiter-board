import { validateMRN } from './validation'
import { PatientLaunchContext, WaiterRecord } from './types'

export const BOARD_SOURCE_APP = 'PharmacyWaiterBoard'
export const DEFAULT_ACTIVE_LOCATION = {
  id: 'main-pharmacy',
  name: 'Main Pharmacy',
}
export const DEFAULT_TARGET_TAB = 'entry'

type LaunchInput = Record<string, unknown>

type LaunchValidationError = {
  valid: false
  message: string
  fields: Record<string, string>
}

type LaunchValidationSuccess = {
  valid: true
  context: PatientLaunchContext
}

function readString(input: LaunchInput, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

function readNumber(input: LaunchInput, keys: string[]): number | undefined {
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

function readPatientName(input: LaunchInput): string | undefined {
  const direct = readString(input, ['patient_name', 'patientName'])
  if (direct) return direct

  const firstName = readString(input, ['first_name', 'firstName'])
  const lastName = readString(input, ['last_name', 'lastName'])
  const combined = [firstName, lastName].filter(Boolean).join(' ').trim()
  return combined || undefined
}

export function normalizePatientLaunchContext(
  input: LaunchInput,
  defaults = DEFAULT_ACTIVE_LOCATION,
): LaunchValidationSuccess | LaunchValidationError {
  const patientMrn = readString(input, ['patient_mrn', 'patientMrn', 'mrn'])
  const patientName = readPatientName(input)
  const activeLocationId = readString(input, ['active_location_id', 'activeLocationId']) ?? defaults.id
  const activeLocationName = readString(input, ['active_location_name', 'activeLocationName']) ?? defaults.name
  const sourceApp = readString(input, ['source_app', 'sourceApp']) ?? BOARD_SOURCE_APP
  const targetTab = readString(input, ['target_tab', 'targetTab']) ?? DEFAULT_TARGET_TAB
  const sourceRecordId = readNumber(input, ['source_record_id', 'sourceRecordId'])
  const patientId = readNumber(input, ['patient_id', 'patientId'])

  const fields: Record<string, string> = {}

  if (!patientMrn) {
    fields.patient_mrn = 'Patient MRN is required'
  } else {
    const mrnValidation = validateMRN(patientMrn)
    if (!mrnValidation.valid) {
      fields.patient_mrn = mrnValidation.message
    }
  }

  if (!patientName) {
    fields.patient_name = 'Patient name is required'
  }

  if (!activeLocationId) {
    fields.active_location_id = 'Active location is required'
  }

  if (!sourceApp) {
    fields.source_app = 'Source app is required'
  }

  if (!targetTab) {
    fields.target_tab = 'Target tab is required'
  }

  if (patientId !== undefined && (!Number.isInteger(patientId) || patientId < 1)) {
    fields.patient_id = 'Patient ID must be a positive integer'
  }

  if (sourceRecordId !== undefined && (!Number.isInteger(sourceRecordId) || sourceRecordId < 1)) {
    fields.source_record_id = 'Source record id must be a positive integer'
  }

  if (Object.keys(fields).length > 0) {
    return {
      valid: false,
      message: 'Invalid patient launch context',
      fields,
    }
  }

  return {
    valid: true,
    context: {
      patientId,
      patientMrn: patientMrn ?? '',
      patientName: patientName ?? '',
      activeLocationId,
      activeLocationName,
      sourceApp,
      targetTab,
      sourceRecordId,
    },
  }
}

export function parsePatientLaunchContextFromSearchParams(
  searchParams: URLSearchParams,
  defaults = DEFAULT_ACTIVE_LOCATION,
): LaunchValidationSuccess | LaunchValidationError {
  return normalizePatientLaunchContext(
    Object.fromEntries(searchParams.entries()),
    defaults,
  )
}

export function buildPatientLaunchHref(
  context: PatientLaunchContext,
  basePath = '/entry',
): string {
  const params = new URLSearchParams()
  params.set('patient_mrn', context.patientMrn)
  params.set('patient_name', context.patientName)
  params.set('active_location_id', context.activeLocationId)
  params.set('active_location_name', context.activeLocationName)
  params.set('source_app', context.sourceApp)
  params.set('target_tab', context.targetTab)
  if (typeof context.sourceRecordId === 'number' && context.sourceRecordId > 0) {
    params.set('source_record_id', String(context.sourceRecordId))
  }
  if (typeof context.patientId === 'number') {
    params.set('patient_id', String(context.patientId))
  }
  return `${basePath}?${params.toString()}`
}

export function buildPatientLaunchContext(record: Pick<
  WaiterRecord,
  | 'id'
  | 'patient_id'
  | 'mrn'
  | 'patient_name'
  | 'first_name'
  | 'last_name'
  | 'active_location_id'
  | 'active_location_name'
  | 'source_app'
>): PatientLaunchContext {
  return {
    patientId: record.patient_id ?? undefined,
    patientMrn: record.mrn,
    patientName: record.patient_name || [record.first_name, record.last_name].filter(Boolean).join(' '),
    activeLocationId: record.active_location_id || DEFAULT_ACTIVE_LOCATION.id,
    activeLocationName: record.active_location_name || DEFAULT_ACTIVE_LOCATION.name,
    sourceApp: record.source_app || BOARD_SOURCE_APP,
    targetTab: DEFAULT_TARGET_TAB,
    sourceRecordId: record.id,
  }
}
