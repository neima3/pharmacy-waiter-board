'use client'

import { Navigation } from '@/components/Navigation'
import { SettingsPanel } from '@/components/SettingsPanel'
import { FadeIn } from '@/components/PageTransition'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <FadeIn>
          <SettingsPanel />
        </FadeIn>
      </main>
    </div>
  )
}
