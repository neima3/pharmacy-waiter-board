import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getRecord, updateRecord, deleteRecord } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase()
    const { id } = await params
    const record = await getRecord(parseInt(id, 10))
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error fetching record:', error)
    return NextResponse.json({ error: 'Failed to fetch record' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase()
    const { id } = await params
    const body = await request.json()
    const { comments, initials, num_prescriptions, printed, ready, completed, moved_to_mail, mailed } = body

    const record = await updateRecord(
      parseInt(id, 10),
      { comments, initials, num_prescriptions, printed, ready, completed, moved_to_mail, mailed },
      initials
    )

    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase()
    const { id } = await params
    const success = await deleteRecord(parseInt(id, 10))
    if (!success) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
