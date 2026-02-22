'use client'

import { Navigation } from '@/components/Navigation'
import { motion } from 'framer-motion'
import { 
  ClipboardList, Pill, Monitor, Settings, 
  Keyboard, HelpCircle, ChevronDown, ChevronRight,
  Clock, CheckCircle, Printer, AlertCircle, Bell,
  Plus, Search, Filter, RefreshCw, Maximize2, Volume2
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'What is a "Waiter" order?',
    answer: 'A Waiter order is a prescription that a patient is waiting for in-store. It has a 30-minute default due time and will appear on the patient-facing board when marked as ready.'
  },
  {
    question: 'What is the difference between Acute and Urgent Mail orders?',
    answer: 'Both Acute and Urgent Mail orders have a 1-hour default due time and do NOT appear on the patient board. They are typically used for prescription requests that will be picked up later or mailed to the patient.'
  },
  {
    question: 'How does the patient board work?',
    answer: 'The patient board displays all Waiter orders that have been marked as "Ready". Patient names are masked for privacy (e.g., "Jo*** Sm***"). When an order is picked up, click "Mark as Picked Up" to remove it from the board.'
  },
  {
    question: 'Can I customize the timing settings?',
    answer: 'Yes! Go to Settings to customize the due time for each order type, as well as the auto-clear time (how long orders stay on the patient board after being marked ready).'
  },
  {
    question: 'What happens when an order is overdue?',
    answer: 'Overdue orders are highlighted with a red indicator on the Production Board. The countdown timer will show "Overdue by Xm" to help staff prioritize these orders.'
  },
]

const keyboardShortcuts = [
  { keys: ['Ctrl', 'Enter'], action: 'Submit form (Entry page)' },
  { keys: ['Tab'], action: 'Navigate between form fields' },
  { keys: ['Esc'], action: 'Cancel editing / Close modal' },
  { keys: ['F11'], action: 'Toggle fullscreen (Patient Board)' },
]

const features = [
  {
    icon: ClipboardList,
    title: 'Entry Board',
    description: 'Create new waiter records with patient information, prescriptions count, and order type.',
    details: [
      'MRN auto-lookup for existing patients',
      'Form validation with helpful error messages',
      'Three order types: Waiter, Acute, and Urgent Mail',
      'Success animation on submission',
      'Keyboard shortcut: Ctrl+Enter to submit'
    ]
  },
  {
    icon: Pill,
    title: 'Production Board',
    description: 'Manage and process all active orders in one place.',
    details: [
      'Real-time countdown timers with color-coded urgency',
      'Filter by order type and search by name/MRN',
      'Bulk actions: mark multiple as printed or ready',
      'Inline comment editing',
      'Time elapsed indicator for each order'
    ]
  },
  {
    icon: Monitor,
    title: 'Patient Board',
    description: 'Public-facing display for patients to see when their order is ready.',
    details: [
      'Large, readable fonts for viewing from across the room',
      'Masked patient names for privacy',
      'Fullscreen mode for TV displays',
      'Optional sound notification for new ready orders',
      'Live clock and date display',
      'Auto-refresh every 10 seconds'
    ]
  },
  {
    icon: Settings,
    title: 'Settings',
    description: 'Configure timing, display preferences, and pharmacy information.',
    details: [
      'Customize due times for each order type',
      'Set auto-clear time for completed orders',
      'Customize patient board message',
      'Adjust font size for patient board',
      'Enable/disable sound notifications',
      'Import/Export settings as JSON'
    ]
  },
]

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [expandedFeature, setExpandedFeature] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="mt-2 text-gray-600">Learn how to use the Pharmacy Waiter Board effectively</p>
        </motion.div>

        <div className="space-y-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <HelpCircle className="h-6 w-6 text-teal-600" />
              Getting Started
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Plus, title: '1. Create Order', description: 'Use the Entry page to create a new waiter record', color: 'bg-green-100 text-green-600' },
                { icon: Clock, title: '2. Process Order', description: 'Monitor and process orders on the Production Board', color: 'bg-blue-100 text-blue-600' },
                { icon: CheckCircle, title: '3. Mark Ready', description: 'Check "Ready" when the prescription is prepared', color: 'bg-amber-100 text-amber-600' },
                { icon: Monitor, title: '4. Patient Pickup', description: 'Patient sees their name on the Patient Board', color: 'bg-purple-100 text-purple-600' },
              ].map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <div className={cn('mb-3 flex h-12 w-12 items-center justify-center rounded-xl', step.color)}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Settings className="h-6 w-6 text-teal-600" />
              Features
            </h2>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFeature(expandedFeature === index ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
                        <feature.icon className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-gray-400 transition-transform',
                        expandedFeature === index && 'rotate-180'
                      )}
                    />
                  </button>
                  {expandedFeature === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 bg-gray-50 p-5"
                    >
                      <ul className="space-y-2">
                        {feature.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Keyboard className="h-6 w-6 text-teal-600" />
              Keyboard Shortcuts
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Shortcut</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {keyboardShortcuts.map((shortcut, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <span key={i}>
                              <kbd className="rounded bg-gray-100 px-2 py-1 text-xs font-mono font-medium text-gray-800 shadow-sm">
                                {key}
                              </kbd>
                              {i < shortcut.keys.length - 1 && (
                                <span className="mx-1 text-gray-400">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">{shortcut.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
              <AlertCircle className="h-6 w-6 text-teal-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-gray-400 transition-transform',
                        expandedFaq === index && 'rotate-180'
                      )}
                    />
                  </button>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 bg-gray-50 px-5 py-4"
                    >
                      <p className="text-sm text-gray-700">{faq.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 p-8 text-white"
          >
            <h2 className="mb-4 text-xl font-semibold">Need More Help?</h2>
            <p className="text-teal-100">
              If you have additional questions or need support, please contact your system administrator 
              or refer to the documentation provided by your IT department.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2">
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">Auto-refresh every 10s</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2">
                <Maximize2 className="h-4 w-4" />
                <span className="text-sm">Fullscreen mode available</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">Sound notifications</span>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  )
}
