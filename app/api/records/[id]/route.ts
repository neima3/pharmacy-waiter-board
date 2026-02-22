import { NextRequest, NextResponse } from 'next/server'
import { getWaiterRecord, updateWaiterRecord, deleteWaiterRecord } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = getWaiterRecord(parseInt(id, 10))
    
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }
    
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
    const { id } = await params
    const body = await request.json()
    const { comments, initials, printed, ready, completed } = body
    
    const record = updateWaiterRecord(
      parseInt(id, 10),
      { comments, initials, printed, ready, completed },
      initials
    )
    
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }
    
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const success = deleteWaiterRecord(parseInt(id, 10))
    
    if (!success) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
