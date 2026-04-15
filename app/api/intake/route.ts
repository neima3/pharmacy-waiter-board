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

export interface IntakeRouteDependencies {
  initializeDatabase: typeof initializeDatabase
  getExternalIntakeEvent: typeof getExternalIntakeEvent
  claimExternalIntakeEvent: typeof claimExternalIntakeEvent
  completeExternalIntakeEvent: typeof completeExternalIntakeEvent
  failExternalIntakeEvent: typeof failExternalIntakeEvent
  getRecordBySourceIdentity: typeof getRecordBySourceIdentity
  createRecord: typeof createRecord
  updateRecord: typeof updateRecord
}

export const intakeRouteDependencies: IntakeRouteDependencies = {
  initializeDatabase,
  getExternalIntakeEvent,
  claimExternalIntakeEvent,
  completeExternalIntakeEvent,
  failExternalIntakeEvent,
  getRecordBySourceIdentity,
  createRecord,
  updateRecord,
}

export async function postIntakeResponse(
  request: NextRequest,
  deps: IntakeRouteDependencies = intakeRouteDependencies,
) {
  try {
    await deps.initializeDatabase()
    const body = await request.json()

    const result = await ingestExternalIntakeRequest(body, {
      getIntakeEvent: deps.getExternalIntakeEvent,
      claimIntakeEvent: deps.claimExternalIntakeEvent,
      completeIntakeEvent: deps.completeExternalIntakeEvent,
      failIntakeEvent: deps.failExternalIntakeEvent,
      getRecordBySourceIdentity: deps.getRecordBySourceIdentity,
      createRecord: async (input) => deps.createRecord({
        ...input,
        due_time: input.due_time || calculateDueTime(input.order_type),
      }),
      updateRecord: async (id, updates, staffInitials) => deps.updateRecord(id, updates, staffInitials, 'update'),
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Error ingesting external intake event:', error)
    return NextResponse.json({ error: 'Failed to ingest external intake event' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return postIntakeResponse(request)
}
