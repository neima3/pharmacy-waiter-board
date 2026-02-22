'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, RefreshCw, CheckCircle, X, Sparkles } from 'lucide-react'
import { MRNSearch } from './MRNSearch'
import { Patient, OrderType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const orderTypes: { value: OrderType; label: string; description: string; color: string }[] = [
  { value: 'waiter', label: 'Waiter', description: 'Due in 30 mins, shows on patient board', color: 'green' },
  { value: 'acute', label: 'Acute', description: 'Due in 1 hr, does not show on patient board', color: 'blue' },
  { value: 'urgent_mail', label: 'Urgent Mail', description: 'Due in 1 hr, does not show on patient board', color: 'purple' },
]

interface FormErrors {
  firstName?: string
  lastName?: string
  dob?: string
  initials?: string
}

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
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const mrnRef = useRef<HTMLInputElement>(null)
  const initialsRef = useRef<HTMLInputElement>(null)
  const firstNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    mrnRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit(e as unknown as React.FormEvent)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mrn, firstName, lastName, dob, initials])

  const handlePatientFound = useCallback((patient: Patient) => {
    setFirstName(patient.first_name)
    setLastName(patient.last_name)
    setDob(patient.dob)
    setIsManualEntry(false)
    setErrors(prev => ({ ...prev, firstName: undefined, lastName: undefined, dob: undefined }))
    initialsRef.current?.focus()
  }, [])

  const handleClear = useCallback(() => {
    setFirstName('')
    setLastName('')
    setDob('')
    setIsManualEntry(false)
  }, [])

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    
    if (!initials.trim()) {
      newErrors.initials = 'Initials are required'
    } else if (initials.length < 2) {
      newErrors.initials = 'Please enter at least 2 initials'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [firstName, lastName, initials])

  const resetForm = useCallback(() => {
    setMrn('')
    setFirstName('')
    setLastName('')
    setDob('')
    setNumPrescriptions(1)
    setComments('')
    setInitials('')
    setOrderType('waiter')
    setIsManualEntry(false)
    setErrors({})
    setTouched(new Set())
    mrnRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      toast.error('Please fix the errors in the form')
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
        toast.success('Record created successfully!', {
          action: {
            label: 'Add Another',
            onClick: () => {
              setShowSuccess(false)
              resetForm()
            }
          }
        })
        setTimeout(() => {
          setShowSuccess(false)
          resetForm()
        }, 2000)
      } else {
        toast.error('Failed to create record')
      }
    } catch (error) {
      console.error('Failed to create record:', error)
      toast.error('Failed to create record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddAnother = () => {
    setShowSuccess(false)
    resetForm()
  }

  const markTouched = (field: string) => {
    setTouched(prev => new Set(prev).add(field))
  }

  const getFieldError = (field: string): string | undefined => {
    return touched.has(field) ? errors[field as keyof FormErrors] : undefined
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <CheckCircle className="h-16 w-16 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-center"
            >
              <span className="text-2xl font-bold text-white">Record Created!</span>
              <p className="mt-2 text-green-100">
                {firstName} {lastName}'s order has been added
              </p>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={handleAddAnother}
              className="mt-6 flex items-center gap-2 rounded-xl bg-white/20 px-6 py-3 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <Sparkles className="h-5 w-5" />
              Add Another Record
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <MRNSearch
              value={mrn}
              onChange={(value) => {
                setMrn(value)
              }}
              onPatientFound={handlePatientFound}
              onClear={handleClear}
              inputRef={mrnRef}
              onBlur={() => markTouched('mrn')}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Initials <span className="text-red-500">*</span>
            </label>
            <input
              ref={initialsRef}
              type="text"
              value={initials}
              onChange={(e) => {
                setInitials(e.target.value.toUpperCase().slice(0, 3))
                if (errors.initials) setErrors(prev => ({ ...prev, initials: undefined }))
              }}
              onBlur={() => markTouched('initials')}
              placeholder="ABC"
              maxLength={3}
              className={cn(
                'input-field uppercase',
                getFieldError('initials') && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              )}
            />
            {getFieldError('initials') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500"
              >
                {getFieldError('initials')}
              </motion.p>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstNameRef}
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                setIsManualEntry(true)
                if (errors.firstName) setErrors(prev => ({ ...prev, firstName: undefined }))
              }}
              onBlur={() => markTouched('firstName')}
              placeholder="John"
              className={cn(
                'input-field',
                getFieldError('firstName') && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              )}
            />
            {getFieldError('firstName') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500"
              >
                {getFieldError('firstName')}
              </motion.p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                setIsManualEntry(true)
                if (errors.lastName) setErrors(prev => ({ ...prev, lastName: undefined }))
              }}
              onBlur={() => markTouched('lastName')}
              placeholder="Doe"
              className={cn(
                'input-field',
                getFieldError('lastName') && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              )}
            />
            {getFieldError('lastName') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500"
              >
                {getFieldError('lastName')}
              </motion.p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => {
                setDob(e.target.value)
                setIsManualEntry(true)
                if (errors.dob) setErrors(prev => ({ ...prev, dob: undefined }))
              }}
              onBlur={() => markTouched('dob')}
              className={cn(
                'input-field',
                getFieldError('dob') && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              )}
            />
            {getFieldError('dob') && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500"
              >
                {getFieldError('dob')}
              </motion.p>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Number of Prescriptions</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNumPrescriptions(Math.max(1, numPrescriptions - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                -
              </button>
              <input
                type="number"
                value={numPrescriptions}
                onChange={(e) => setNumPrescriptions(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="input-field w-20 text-center"
              />
              <button
                type="button"
                onClick={() => setNumPrescriptions(numPrescriptions + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Order Type</label>
            <div className="flex gap-2">
              {orderTypes.map((type) => (
                <motion.button
                  key={type.value}
                  type="button"
                  onClick={() => setOrderType(type.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all',
                    orderType === type.value
                      ? type.color === 'green'
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                        : type.color === 'blue'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {type.label}
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {orderTypes.find(t => t.value === orderType)?.description}
            </p>
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

        <div className="flex items-center justify-between gap-3 border-t pt-6">
          <p className="text-sm text-gray-500">
            <kbd className="rounded bg-gray-100 px-2 py-1 text-xs font-mono">Ctrl</kbd>
            +
            <kbd className="rounded bg-gray-100 px-2 py-1 text-xs font-mono">Enter</kbd>
            to submit
          </p>
          <div className="flex gap-3">
            <motion.button
              type="button"
              onClick={resetForm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary"
            >
              <X className="h-4 w-4" />
              Clear
            </motion.button>
            
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary min-w-[150px]"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Creating...' : 'Create Record'}</span>
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  )
}
