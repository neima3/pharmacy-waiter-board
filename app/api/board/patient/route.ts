import { NextResponse } from 'next/server'
import { getPatientBoardRecords, cleanupOldRecords } from '@/lib/db'

export async function GET() {
  try {
    cleanupOldRecords()
    const records = getPatientBoardRecords()
    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching patient board:', error)
    return NextResponse.json({ error: 'Failed to fetch patient board' }, { status: 500 })
  }
}
