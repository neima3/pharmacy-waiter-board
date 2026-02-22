'use client'

import { Navigation } from '@/components/Navigation'
import { SettingsPanel } from '@/components/SettingsPanel'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <SettingsPanel />
      </main>
    </div>
  )
}
