'use client'

import { Navigation } from '@/components/Navigation'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/PageTransition'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ClipboardList, Pill, Monitor, Settings, ArrowRight, Sparkles } from 'lucide-react'

const cards = [
  {
    href: '/entry',
    icon: ClipboardList,
    title: 'Entry',
    description: 'Create new waiter records for patients',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  {
    href: '/production',
    icon: Pill,
    title: 'Production',
    description: 'Manage and process active orders',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  {
    href: '/board',
    icon: Monitor,
    title: 'Patient Board',
    description: 'Public display for ready orders',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  {
    href: '/settings',
    icon: Settings,
    title: 'Settings',
    description: 'Configure timing and preferences',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600'
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <FadeIn>
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-700 mb-6"
            >
              <Sparkles className="h-4 w-4" />
              Pharmacy Waiter Board
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Welcome Back
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Manage pharmacy orders efficiently with our waiter board system. 
              Create orders, track progress, and keep patients informed.
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2">
          {cards.map((card) => (
            <StaggerItem key={card.href}>
              <Link href={card.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 transition-opacity group-hover:opacity-5`} />
                  
                  <div className="relative flex items-start gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${card.bgColor}`}>
                      <card.icon className={`h-7 w-7 ${card.textColor}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-900">{card.title}</h3>
                        <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-gray-600" />
                      </div>
                      <p className="mt-1 text-gray-600">{card.description}</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.4}>
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold">Need Help?</h2>
                <p className="mt-1 text-slate-300">
                  Check out our documentation and keyboard shortcuts
                </p>
              </div>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                View Help Center
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </main>
    </div>
  )
}
