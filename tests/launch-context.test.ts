import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPatientLaunchContext,
  buildPatientLaunchHref,
  normalizePatientLaunchContext,
  parsePatientLaunchContextFromSearchParams,
  DEFAULT_ACTIVE_LOCATION,
} from '../lib/launch-context'

test('normalizes launch payloads from form bodies', () => {
  const result = normalizePatientLaunchContext({
    mrn: 'MRN-10001',
    first_name: 'James',
    last_name: 'Anderson',
    patient_id: 42,
    active_location_id: 'north-window',
    active_location_name: 'North Window',
    source_app: 'PharmacyWaiterBoard',
    target_tab: 'entry',
    source_record_id: 17,
  })

  assert.equal(result.valid, true)
  if (!result.valid) return

  assert.deepEqual(result.context, {
    patientId: 42,
    patientMrn: 'MRN-10001',
    patientName: 'James Anderson',
    activeLocationId: 'north-window',
    activeLocationName: 'North Window',
    sourceApp: 'PharmacyWaiterBoard',
    targetTab: 'entry',
    sourceRecordId: 17,
  })
})

test('rejects malformed launch payloads', () => {
  const result = normalizePatientLaunchContext({
    mrn: 'bad mrn!',
    first_name: '',
    last_name: '',
    patient_id: 0,
  })

  assert.equal(result.valid, false)
  if (result.valid) return

  assert.equal(result.message, 'Invalid patient launch context')
  assert.equal(result.fields.patient_mrn, 'MRN must be alphanumeric')
  assert.equal(result.fields.patient_name, 'Patient name is required')
  assert.equal(result.fields.patient_id, 'Patient ID must be a positive integer')
})

test('round-trips launch context to and from a launch href', () => {
  const href = buildPatientLaunchHref(
    buildPatientLaunchContext({
      id: 19,
      patient_id: 42,
      mrn: 'MRN-10042',
      patient_name: 'Maria Rodriguez',
      first_name: 'Maria',
      last_name: 'Rodriguez',
      active_location_id: DEFAULT_ACTIVE_LOCATION.id,
      active_location_name: DEFAULT_ACTIVE_LOCATION.name,
      source_app: 'PharmacyWaiterBoard',
    }),
  )

  const parsed = parsePatientLaunchContextFromSearchParams(new URL(href, 'https://example.test').searchParams)
  assert.equal(parsed.valid, true)
  if (!parsed.valid) return

  assert.deepEqual(parsed.context, {
    patientId: 42,
    patientMrn: 'MRN-10042',
    patientName: 'Maria Rodriguez',
    activeLocationId: DEFAULT_ACTIVE_LOCATION.id,
    activeLocationName: DEFAULT_ACTIVE_LOCATION.name,
    sourceApp: 'PharmacyWaiterBoard',
    targetTab: 'entry',
    sourceRecordId: 19,
  })
})
