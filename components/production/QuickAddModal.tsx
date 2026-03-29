'use client'

import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Check, X } from 'lucide-react'
import { OrderType } from '@/lib/types'
import { cn, parseFlexibleDate } from '@/lib/utils'
import { toast } from 'sonner'

const orderTypeOptions: { value: OrderType; label: string; color: string }[] = [
  { value: 'waiter', label: 'W', color: 'green' },
  { value: 'acute', label: 'A', color: 'blue' },
  { value: 'urgent_mail', label: 'U', color: 'purple' },
  { value: 'mail', label: 'M', color: 'orange' },
]

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const QuickAddModal = memo(function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    mrn: '',
    num_prescriptions: 1,
    initials: '',
    order_type: 'waiter' as OrderType,
    comments: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      dob: '',
      mrn: '',
      num_prescriptions: 1,
      initials: '',
      order_type: 'waiter',
      comments: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.first_name.trim() || !form.last_name.trim() || !form.initials.trim()) {
      toast.error('First name, last name, and initials are required')
      return
    }

    setIsSubmitting(true)
    const parsedDob = form.dob ? parseFlexibleDate(form.dob) : ''

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, dob: parsedDob }),
      })

      if (response.ok) {
        toast.success(`Order created for ${form.first_name} ${form.last_name}`)
        resetForm()
        onClose()
        onSuccess()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || 'Failed to create record')
      }
    } catch {
      toast.error('Failed to create record')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="rounded-xl border-2 border-teal-200 bg-teal-50/50 p-4 mb-4"
      aria-label="Quick add order form"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="First Name"
            value={form.first_name}
            onChange={e => setForm(prev => ({ ...prev, first_name: e.target.value }))}
            className="input-field w-32 py-1.5 text-sm"
            autoFocus
            aria-label="First name"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={form.last_name}
            onChange={e => setForm(prev => ({ ...prev, last_name: e.target.value }))}
            className="input-field w-32 py-1.5 text-sm"
            aria-label="Last name"
          />
          <input
            type="text"
            placeholder="DOB (opt)"
            value={form.dob}
            onChange={e => setForm(prev => ({ ...prev, dob: e.target.value }))}
            className="input-field w-24 py-1.5 text-sm"
            title="Enter as mm/dd/yy, mmddyy, or mm/dd/yyyy"
            aria-label="Date of birth (optional)"
          />
          <input
            type="text"
            placeholder="MRN (opt)"
            value={form.mrn}
            onChange={e => setForm(prev => ({ ...prev, mrn: e.target.value }))}
            className="input-field w-28 py-1.5 text-sm"
            aria-label="MRN (optional)"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600"># Rx:</span>
          <input
            type="number"
            min={1}
            value={form.num_prescriptions}
            onChange={e => setForm(prev => ({ ...prev, num_prescriptions: parseInt(e.target.value) || 1 }))}
            className="input-field w-16 py-1.5 text-sm text-center"
            aria-label="Number of prescriptions"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Initials"
            value={form.initials}
            onChange={e => setForm(prev => ({ ...prev, initials: e.target.value.toUpperCase().slice(0, 3) }))}
            className="input-field w-20 py-1.5 text-sm uppercase"
            maxLength={3}
            aria-label="Staff initials"
          />
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Order type">
          {orderTypeOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, order_type: opt.value }))}
              className={cn(
                'rounded px-2 py-1 text-xs font-bold transition-colors',
                form.order_type === opt.value
                  ? opt.color === 'green' ? 'bg-green-500 text-white'
                    : opt.color === 'blue' ? 'bg-blue-500 text-white'
                    : opt.color === 'purple' ? 'bg-purple-500 text-white'
                    : 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              )}
              aria-label={`Order type: ${opt.value}`}
              aria-pressed={form.order_type === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Comments..."
          value={form.comments}
          onChange={e => setForm(prev => ({ ...prev, comments: e.target.value }))}
          className="input-field flex-1 min-w-[150px] py-1.5 text-sm"
          aria-label="Comments"
        />

        <div className="flex items-center gap-2 ml-auto">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary py-1.5"
            aria-label="Add order"
          >
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Add
          </motion.button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200"
            aria-label="Close quick add form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.form>
  )
})
