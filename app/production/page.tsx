'use client'

import { Navigation } from '@/components/Navigation'
import { ProductionBoard } from '@/components/ProductionBoard'

export default function ProductionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <ProductionBoard />
      </main>
    </div>
  )
}
