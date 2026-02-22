'use client'

import { Navigation } from '@/components/Navigation'
import { WaiterForm } from '@/components/WaiterForm'

export default function EntryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Waiter Record</h1>
          <p className="mt-2 text-gray-600">Enter patient information to create a new waiter record</p>
        </div>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <WaiterForm />
        </div>
      </main>
    </div>
  )
}
