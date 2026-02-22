import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getSettings, updateSettings } from '@/lib/db'

export async function GET() {
  try {
    await initializeDatabase()
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase()
    const body = await request.json()
    await updateSettings(body)
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
