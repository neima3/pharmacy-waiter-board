import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getActiveRecords, getProductionRecords, getCompletedRecords, createRecord, getMailQueueRecords, getCompletedMailRecords, getMailHistoryRecords } from '@/lib/db'
import { calculateDueTime } from '@/lib/utils'
import { OrderType } from '@/lib/types'
import { validateRecord, sanitizeString } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
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
    return NextResponse.json(records)
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

    const { mrn, first_name, last_name, dob, num_prescriptions, comments, initials, order_type } = body

    const record = await createRecord({
      mrn: mrn || '',
      first_name: sanitizeString(first_name),
      last_name: sanitizeString(last_name),
      dob: dob || '',
      num_prescriptions: num_prescriptions || 1,
      comments: sanitizeString(comments || ''),
      initials,
      order_type: (order_type || 'waiter') as OrderType,
      due_time: calculateDueTime((order_type || 'waiter') as OrderType),
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
