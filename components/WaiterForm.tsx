'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, RefreshCw, CheckCircle } from 'lucide-react'
import { MRNSearch } from './MRNSearch'
import { Patient, OrderType } from '@/lib/types'
import { cn } from '@/lib/utils'

const orderTypes: { value: OrderType; label: string; description: string }[] = [
  { value: 'waiter', label: 'Waiter', description: 'Due in 30 mins, shows on patient board' },
  { value: 'acute', label: 'Acute', description: 'Due in 1 hr, does not show on patient board' },
  { value: 'urgent_mail', label: 'Urgent Mail', description: 'Due in 1 hr, does not show on patient board' },
]

export function WaiterForm() {
  const [mrn, setMrn] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [numPrescriptions, setNumPrescriptions] = useState(1)
  const [comments, setComments] = useState('')
  const [initials, setInitials] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('waiter')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isManualEntry, setIsManualEntry] = useState(false)

  const handlePatientFound = useCallback((patient: Patient) => {
    setFirstName(patient.first_name)
    setLastName(patient.last_name)
    setDob(patient.dob)
    setIsManualEntry(false)
  }, [])

  const handleClear = useCallback(() => {
    setFirstName('')
    setLastName('')
    setDob('')
    setIsManualEntry(false)
  }, [])

  const resetForm = () => {
    setMrn('')
    setFirstName('')
    setLastName('')
    setDob('')
    setNumPrescriptions(1)
    setComments('')
    setInitials('')
    setOrderType('waiter')
    setIsManualEntry(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mrn || !firstName || !lastName || !dob || !initials) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mrn,
          first_name: firstName,
          last_name: lastName,
          dob,
          num_prescriptions: numPrescriptions,
          comments,
          initials,
          order_type: orderType,
        }),
      })
      
      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          resetForm()
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to create record:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-green-500"
          >
            <div className="flex items-center gap-3 text-white">
              <CheckCircle className="h-8 w-8" />
              <span className="text-xl font-semibold">Record Created!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <MRNSearch
            value={mrn}
            onChange={setMrn}
            onPatientFound={handlePatientFound}
            onClear={handleClear}
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Initials</label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))}
              placeholder="ABC"
              maxLength={3}
              className="input-field uppercase"
              required
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                setIsManualEntry(true)
              }}
              placeholder="John"
              className="input-field"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                setIsManualEntry(true)
              }}
              placeholder="Doe"
              className="input-field"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => {
                setDob(e.target.value)
                setIsManualEntry(true)
              }}
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Number of Prescriptions</label>
            <input
              type="number"
              value={numPrescriptions}
              onChange={(e) => setNumPrescriptions(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Order Type</label>
            <div className="flex gap-2">
              {orderTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setOrderType(type.value)}
                  className={cn(
                    'flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                    orderType === type.value
                      ? type.value === 'waiter'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : type.value === 'acute'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Comments</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Notes for production team..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !mrn || !firstName || !lastName || !dob || !initials}
            className="btn-primary flex-1"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Create Record</span>
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  )
}
