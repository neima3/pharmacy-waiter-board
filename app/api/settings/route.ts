import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getSettings, updateSettings } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await initializeDatabase()
    const settings = await getSettings()
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase()
    const body = await request.json()
    console.log('Updating settings with:', body)
    await updateSettings(body)
    const settings = await getSettings()
    console.log('Settings after update:', settings)
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
