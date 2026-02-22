'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Check, X, Loader2 } from 'lucide-react'
import { Patient } from '@/lib/types'

interface MRNSearchProps {
  onPatientFound: (patient: Patient) => void
  onClear: () => void
  value: string
  onChange: (value: string) => void
}

export function MRNSearch({ onPatientFound, onClear, value, onChange }: MRNSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (value.length >= 5) {
      searchMRN()
    } else {
      setFoundPatient(null)
      setNotFound(false)
    }
  }, [value])

  const searchMRN = async () => {
    setIsSearching(true)
    setNotFound(false)
    
    try {
      const response = await fetch(`/api/patients/search?mrn=${encodeURIComponent(value)}`)
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
  }

  const handleClear = () => {
    onChange('')
    setFoundPatient(null)
    setNotFound(false)
    onClear()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">MRN</label>
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="MRN-XXXXX"
            className={`input-field pr-20 ${foundPatient ? 'border-green-500 bg-green-50' : ''} ${notFound ? 'border-yellow-500 bg-yellow-50' : ''}`}
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
            {foundPatient && (
              <Check className="h-4 w-4 text-green-600" />
            )}
            {(foundPatient || notFound) && !isSearching && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded p-1 hover:bg-gray-200"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {foundPatient && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-green-50 p-3 text-sm"
          >
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-4 w-4" />
              <span className="font-medium">Patient Found:</span>
            </div>
            <div className="mt-1 text-green-700">
              {foundPatient.first_name} {foundPatient.last_name} • DOB: {foundPatient.dob}
            </div>
          </motion.div>
        )}
        
        {notFound && !foundPatient && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-yellow-50 p-3 text-sm"
          >
            <div className="text-yellow-800">
              No patient found with this MRN. Please enter details manually.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
