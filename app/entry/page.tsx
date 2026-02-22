'use client'

import { Navigation } from '@/components/Navigation'
import { WaiterForm } from '@/components/WaiterForm'
import { FadeIn } from '@/components/PageTransition'

export default function EntryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Waiter Record</h1>
            <p className="mt-2 text-gray-600">Enter patient information to create a new waiter record</p>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <WaiterForm />
          </div>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          <div className="mt-6 rounded-xl bg-teal-50 p-4 border border-teal-100">
            <h3 className="font-medium text-teal-800">Tips</h3>
            <ul className="mt-2 space-y-1 text-sm text-teal-700">
              <li>• Enter MRN first to auto-fill patient details if they exist</li>
              <li>• Use <kbd className="px-1.5 py-0.5 bg-teal-100 rounded text-xs font-mono">Tab</kbd> to navigate between fields</li>
              <li>• Press <kbd className="px-1.5 py-0.5 bg-teal-100 rounded text-xs font-mono">Ctrl+Enter</kbd> to submit quickly</li>
            </ul>
          </div>
        </FadeIn>
      </main>
    </div>
  )
}
