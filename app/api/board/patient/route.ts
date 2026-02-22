import { NextResponse } from 'next/server'
import { initializeDatabase, getReadyWaiterRecords } from '@/lib/db'

export async function GET() {
  try {
    await initializeDatabase()
    const records = await getReadyWaiterRecords()
    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching patient board:', error)
    return NextResponse.json({ error: 'Failed to fetch patient board' }, { status: 500 })
  }
}
