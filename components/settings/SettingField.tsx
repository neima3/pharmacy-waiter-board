'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Settings } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SettingFieldConfig } from './settingsConfig'

interface SettingFieldProps {
  config: SettingFieldConfig
  value: Settings[keyof Settings]
  onChange: (value: Settings[keyof Settings]) => void
}

export const SettingField = memo(function SettingField({ config, value, onChange }: SettingFieldProps) {
  if (config.type === 'toggle') {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div>
          <label className="font-medium text-gray-700">{config.label}</label>
          {config.description && (
            <p className="text-sm text-gray-500">{config.description}</p>
          )}
        </div>
        <motion.button
          onClick={() => onChange(!value)}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative h-7 w-14 rounded-full transition-colors',
            value ? 'bg-teal-600' : 'bg-gray-300'
          )}
          role="switch"
          aria-checked={Boolean(value)}
          aria-label={config.label}
        >
          <motion.span
            animate={{ x: value ? 28 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm"
          />
        </motion.button>
      </div>
    )
  }

  if (config.type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">{config.label}</label>
        {config.description && (
          <p className="text-xs text-gray-400">{config.description}</p>
        )}
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="input-field mt-1"
          aria-label={config.label}
        >
          {config.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  }

  if (config.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">{config.label}</label>
        {config.description && (
          <p className="text-xs text-gray-400">{config.description}</p>
        )}
        <textarea
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="input-field mt-1 resize-none"
          placeholder={config.placeholder}
          aria-label={config.label}
        />
      </div>
    )
  }

  if (config.type === 'number') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">{config.label}</label>
        {config.description && (
          <p className="text-xs text-gray-400">{config.description}</p>
        )}
        <input
          type="number"
          value={Number(value)}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="input-field mt-1"
          min={config.min}
          max={config.max}
          aria-label={config.label}
        />
      </div>
    )
  }

  // text
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{config.label}</label>
      {config.description && (
        <p className="text-xs text-gray-400">{config.description}</p>
      )}
      <input
        type="text"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="input-field mt-1"
        placeholder={config.placeholder}
        aria-label={config.label}
      />
    </div>
  )
})
