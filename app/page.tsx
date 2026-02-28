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
    gradient: 'from-emerald-500 to-teal-600',
    lightGradient: 'from-emerald-50 to-teal-50/50',
    iconBg: 'bg-emerald-100/80',
    iconColor: 'text-emerald-600',
    shadowColor: 'hover:shadow-emerald-500/25',
    borderColor: 'group-hover:border-emerald-200'
  },
  {
    href: '/production',
    icon: Pill,
    title: 'Production',
    description: 'Manage and process active orders',
    gradient: 'from-blue-500 to-indigo-600',
    lightGradient: 'from-blue-50 to-indigo-50/50',
    iconBg: 'bg-blue-100/80',
    iconColor: 'text-blue-600',
    shadowColor: 'hover:shadow-blue-500/25',
    borderColor: 'group-hover:border-blue-200'
  },
  {
    href: '/board',
    icon: Monitor,
    title: 'Patient Board',
    description: 'Public display for ready orders',
    gradient: 'from-violet-500 to-purple-600',
    lightGradient: 'from-violet-50 to-purple-50/50',
    iconBg: 'bg-violet-100/80',
    iconColor: 'text-violet-600',
    shadowColor: 'hover:shadow-violet-500/25',
    borderColor: 'group-hover:border-violet-200'
  },
  {
    href: '/settings',
    icon: Settings,
    title: 'Settings',
    description: 'Configure timing and preferences',
    gradient: 'from-orange-400 to-rose-500',
    lightGradient: 'from-orange-50 to-rose-50/50',
    iconBg: 'bg-orange-100/80',
    iconColor: 'text-orange-600',
    shadowColor: 'hover:shadow-orange-500/25',
    borderColor: 'group-hover:border-orange-200'
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-16">
        <FadeIn>
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-teal-700 mb-8 shadow-sm border border-teal-100/50 ring-1 ring-teal-50"
            >
              <Sparkles className="h-4 w-4 text-teal-500" />
              Pharmacy Waiter Board
            </motion.div>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
              Welcome Back
            </h1>
            <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Manage pharmacy orders efficiently with our waiter board system. 
              Create orders, track progress, and keep patients informed.
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2">
          {cards.map((card) => (
            <StaggerItem key={card.href}>
              <Link href={card.href} className="block outline-none">
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br ${card.lightGradient} p-8 shadow-lg shadow-slate-200/50 transition-all duration-300 ${card.shadowColor} ${card.borderColor} backdrop-blur-xl`}
                >
                  <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${card.gradient} opacity-5 blur-3xl transition-opacity duration-500 group-hover:opacity-15`} />
                  
                  <div className="relative z-10 flex flex-col items-start gap-6">
                    <div className="flex w-full items-center justify-between">
                      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} shadow-sm ring-1 ring-white/50`}>
                        <card.icon className={`h-8 w-8 ${card.iconColor}`} />
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0`}>
                        <ArrowRight className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{card.title}</h3>
                      <p className="text-slate-600 font-medium leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.4}>
          <div className="mt-16 overflow-hidden rounded-[2.5rem] bg-slate-900 p-1 relative shadow-2xl shadow-slate-900/20">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
            <div className="relative rounded-[2.4rem] bg-gradient-to-br from-slate-900 to-slate-800 p-10 md:p-12 text-white overflow-hidden">
              <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl"></div>
              <div className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-3xl font-bold mb-3 tracking-tight">Need Help?</h2>
                  <p className="text-lg text-slate-300 font-medium">
                    Check out our documentation and keyboard shortcuts
                  </p>
                </div>
                <Link
                  href="/help"
                  className="group inline-flex items-center gap-3 rounded-2xl bg-white/10 px-8 py-4 font-semibold backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-slate-900 hover:shadow-xl hover:shadow-white/20 hover:-translate-y-1"
                >
                  View Help Center
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </main>
    </div>
  )
}
