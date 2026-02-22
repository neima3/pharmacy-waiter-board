'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Check, X, Loader2, User, AlertCircle } from 'lucide-react'
import { Patient } from '@/lib/types'
import { cn } from '@/lib/utils'
import { debounce } from 'lodash'

interface MRNSearchProps {
  onPatientFound: (patient: Patient) => void
  onClear: () => void
  value: string
  onChange: (value: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  error?: string
  onBlur?: () => void
}

export function MRNSearch({ 
  onPatientFound, 
  onClear, 
  value, 
  onChange, 
  inputRef,
  error,
  onBlur 
}: MRNSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null)
  const [notFound, setNotFound] = useState(false)
  const internalRef = useRef<HTMLInputElement>(null)
  const searchRef = (inputRef as React.RefObject<HTMLInputElement>) || internalRef

  const searchMRN = useCallback(async (searchValue: string) => {
    if (searchValue.length < 5) {
      setFoundPatient(null)
      setNotFound(false)
      return
    }
    
    setIsSearching(true)
    setNotFound(false)
    
    try {
      const response = await fetch(`/api/patients/search?mrn=${encodeURIComponent(searchValue)}`)
      const data = await response.json()
      
      if (data.found) {
        setFoundPatient(data.patient)
        onPatientFound(data.patient)
      } else {
        setFoundPatient(null)
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }, [onPatientFound])

  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      searchMRN(searchValue)
    }, 300),
    [searchMRN]
  )

  useEffect(() => {
    debouncedSearch(value)
    return () => {
      debouncedSearch.cancel()
    }
  }, [value, debouncedSearch])

  const handleClear = () => {
    onChange('')
    setFoundPatient(null)
    setNotFound(false)
    onClear()
    searchRef.current?.focus()
  }

  const inputClasses = cn(
    'input-field pr-20 transition-all duration-200',
    foundPatient && 'border-green-500 bg-green-50 ring-2 ring-green-500/20',
    notFound && !foundPatient && 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-500/20',
    error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
  )

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        MRN <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <div className="relative">
          <motion.div
            animate={isSearching ? { scale: [1, 1.01, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <input
              ref={searchRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              onBlur={onBlur}
              placeholder="MRN-XXXXX"
              className={inputClasses}
            />
          </motion.div>
          
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <AnimatePresence mode="wait">
              {isSearching && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                </motion.div>
              )}
              {foundPatient && !isSearching && (
                <motion.div
                  key="found"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </motion.div>
              )}
              {notFound && !foundPatient && !isSearching && (
                <motion.div
                  key="notfound"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {(foundPatient || notFound || value) && !isSearching && (
              <motion.button
                type="button"
                onClick={handleClear}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="rounded p-1 hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
      
      <AnimatePresence>
        {foundPatient && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="h-4 w-4" />
                    <span className="font-semibold">Patient Found</span>
                  </div>
                  <div className="mt-1 text-green-700">
                    <span className="font-medium">{foundPatient.first_name} {foundPatient.last_name}</span>
                    <span className="mx-2">•</span>
                    <span>DOB: {new Date(foundPatient.dob).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {notFound && !foundPatient && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-yellow-800 font-medium">
                    New Patient
                  </div>
                  <div className="mt-1 text-yellow-700">
                    No existing record found. Please enter patient details manually.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
