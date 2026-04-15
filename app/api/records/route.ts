import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getActiveRecords, getProductionRecords, getCompletedRecords, createRecord, getMailQueueRecords, getCompletedMailRecords, getMailHistoryRecords, syncExpiredWorkflowEvents } from '@/lib/db'
import { calculateDueTime } from '@/lib/utils'
import { OrderType } from '@/lib/types'
import { validateRecord, sanitizeString } from '@/lib/validation'
import { normalizePatientLaunchContext } from '@/lib/launch-context'
import { buildQueueRecordResponse, buildQueueRecordsResponse } from '@/lib/queue-contract'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    await syncExpiredWorkflowEvents()
    const type = request.nextUrl.searchParams.get('type')
    let records
    switch (type) {
      case 'completed':
        records = await getCompletedRecords()
        break
      case 'mail_queue':
        records = await getMailQueueRecords()
        break
      case 'completed_mail':
        records = await getCompletedMailRecords()
        break
      case 'mail_history':
        records = await getMailHistoryRecords()
        break
      case 'production':
        records = await getProductionRecords()
        break
      default:
        records = await getActiveRecords()
    }
    return NextResponse.json(buildQueueRecordsResponse(records))
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const body = await request.json()

    const validation = validateRecord(body)
    if (!validation.valid) {
      return NextResponse.json({ error: 'Validation failed', fields: validation.fields }, { status: 400 })
    }

    const launchContext = normalizePatientLaunchContext(body)
    if (!launchContext.valid) {
      return NextResponse.json({ error: launchContext.message, fields: launchContext.fields }, { status: 400 })
    }

    const { mrn, first_name, last_name, dob, num_prescriptions, comments, initials, order_type } = body
    const patientName = sanitizeString(launchContext.context.patientName)

    const record = await createRecord({
      mrn: mrn || '',
      patient_id: launchContext.context.patientId ?? null,
      patient_name: patientName,
      first_name: sanitizeString(first_name),
      last_name: sanitizeString(last_name),
      dob: dob || '',
      num_prescriptions: num_prescriptions || 1,
      comments: sanitizeString(comments || ''),
      initials,
      order_type: (order_type || 'waiter') as OrderType,
      due_time: calculateDueTime((order_type || 'waiter') as OrderType),
      active_location_id: sanitizeString(launchContext.context.activeLocationId),
      active_location_name: sanitizeString(launchContext.context.activeLocationName),
      source_app: sanitizeString(launchContext.context.sourceApp),
      source_record_id: launchContext.context.sourceRecordId ?? null,
    })

    return NextResponse.json(buildQueueRecordResponse(record), { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
