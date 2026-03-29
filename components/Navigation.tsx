'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClipboardList, 
  Pill, 
  Monitor, 
  Settings as SettingsIcon,
  Home,
  HelpCircle,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/entry', label: 'Entry', icon: ClipboardList, description: 'Create new orders' },
  { href: '/production', label: 'Production', icon: Pill, description: 'Manage orders' },
  { href: '/board', label: 'Patient Board', icon: Monitor, description: 'Public display' },
  { href: '/settings', label: 'Settings', icon: SettingsIcon, description: 'Configure system' },
  { href: '/help', label: 'Help', icon: HelpCircle, description: 'Documentation' },
]

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const isPatientBoard = pathname === '/board'
  
  if (isPatientBoard) return null
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 border-b border-white/10 shadow-2xl shadow-black/20"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/entry" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="p-2 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/50"
            >
              <Home className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-emerald-300 group-hover:from-teal-200 group-hover:to-emerald-200 transition-all duration-300">
                Pharmacy Board
              </span>
              <span className="text-[10px] font-medium text-slate-400 -mt-1">Management System</span>
            </div>
          </Link>
          
          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <motion.div
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300',
                      isActive 
                        ? 'text-white' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    )}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/50"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-white/50 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </div>

          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="rounded-xl p-2.5 hover:bg-white/10 md:hidden transition-colors border border-white/10"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 md:hidden bg-slate-900/95 backdrop-blur-xl"
          >
            <div className="space-y-1 px-4 py-4">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300',
                        isActive 
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30' 
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-bold">{item.label}</div>
                        <div className="text-xs opacity-75 font-normal">{item.description}</div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
