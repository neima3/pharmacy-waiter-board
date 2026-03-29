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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-20 relative">
        <FadeIn>
          <div className="text-center mb-20">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-white mb-10 shadow-xl shadow-teal-500/30"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              Premium Pharmacy Management
              <Sparkles className="h-4 w-4 animate-pulse" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-6xl sm:text-7xl font-black tracking-tight mb-6"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900">
                Welcome to
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 animate-gradient">
                Pharmacy Board
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Streamline your pharmacy operations with our modern waiter board system. 
              <span className="text-teal-600 font-semibold"> Create orders, track progress, and keep patients informed</span> with real-time updates.
            </motion.p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid gap-8 sm:grid-cols-2">
          {cards.map((card, index) => (
            <StaggerItem key={card.href}>
              <Link href={card.href} className="block outline-none group">
                <motion.div
                  whileHover={{ scale: 1.03, y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`relative overflow-hidden rounded-[2.5rem] border-2 border-white/80 bg-gradient-to-br ${card.lightGradient} p-10 shadow-2xl transition-all duration-500 hover:shadow-3xl ${card.shadowColor} ${card.borderColor} backdrop-blur-xl group-hover:border-2`}
                >
                  <div className={`absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br ${card.gradient} opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-20`} />
                  <div className={`absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-gradient-to-br ${card.gradient} opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-10`} />
                  
                  <div className="relative z-10 flex flex-col items-start gap-6">
                    <div className="flex w-full items-center justify-between">
                      <motion.div 
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6, type: 'spring' }}
                        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} shadow-xl ring-4 ring-white/50`}
                      >
                        <card.icon className={`h-10 w-10 ${card.iconColor}`} />
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className={`flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0`}
                      >
                        <ArrowRight className={`h-6 w-6 ${card.iconColor}`} />
                      </motion.div>
                    </div>
                    
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 mb-3">{card.title}</h3>
                      <p className="text-slate-600 font-semibold leading-relaxed text-lg">{card.description}</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.5}>
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-20 overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 relative shadow-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 opacity-20 animate-pulse blur-xl"></div>
            <div className="relative rounded-[2.8rem] bg-gradient-to-br from-slate-900 to-slate-800 p-12 md:p-16 text-white overflow-hidden">
              <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-teal-500/20 blur-3xl animate-pulse"></div>
              <div className="absolute -left-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div>
                  <motion.h2 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-4xl font-black mb-4 tracking-tight"
                  >
                    Need Help?
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-xl text-slate-300 font-semibold"
                  >
                    Check out our comprehensive documentation
                  </motion.p>
                </div>
                <Link
                  href="/help"
                  className="group inline-flex items-center gap-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-10 py-5 font-bold text-lg backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/50 hover:-translate-y-2"
                >
                  View Help Center
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                </Link>
              </div>
            </div>
          </motion.div>
        </FadeIn>
      </main>
    </div>
  )
}
