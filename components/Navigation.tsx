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
      className="sticky top-0 z-50 bg-primary-900/95 text-white shadow-lg backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/entry" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Home className="h-6 w-6 text-accent-400" />
            </motion.div>
            <span className="text-lg font-semibold group-hover:text-accent-400 transition-colors">
              Pharmacy Board
            </span>
          </Link>
          
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative"
                >
                  <motion.div
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-300 hover:bg-primary-800 hover:text-white'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg bg-accent-600"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{item.label}</span>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 hover:bg-primary-800 md:hidden"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-primary-800 md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                        isActive 
                          ? 'bg-accent-600 text-white' 
                          : 'text-gray-300 hover:bg-primary-800 hover:text-white'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <div>
                        <div>{item.label}</div>
                        <div className="text-xs text-gray-400">{item.description}</div>
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
