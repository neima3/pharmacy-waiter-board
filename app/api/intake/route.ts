import { NextRequest, NextResponse } from 'next/server'
import { calculateDueTime } from '@/lib/utils'
import {
  claimExternalIntakeEvent,
  completeExternalIntakeEvent,
  failExternalIntakeEvent,
  getExternalIntakeEvent,
  getRecordBySourceIdentity,
  createRecord,
  updateRecord,
  initializeDatabase,
} from '@/lib/db'
import { ingestExternalIntakeRequest } from '@/lib/external-intake'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const body = await request.json()

    const result = await ingestExternalIntakeRequest(body, {
      getIntakeEvent: getExternalIntakeEvent,
      claimIntakeEvent: claimExternalIntakeEvent,
      completeIntakeEvent: completeExternalIntakeEvent,
      failIntakeEvent: failExternalIntakeEvent,
      getRecordBySourceIdentity,
      createRecord: async (input) => createRecord({
        ...input,
        due_time: input.due_time || calculateDueTime(input.order_type),
      }),
      updateRecord: async (id, updates, staffInitials) => updateRecord(id, updates, staffInitials, 'update'),
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Error ingesting external intake event:', error)
    return NextResponse.json({ error: 'Failed to ingest external intake event' }, { status: 500 })
  }
}
