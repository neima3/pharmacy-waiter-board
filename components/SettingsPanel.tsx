'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Save, RefreshCw, Settings as SettingsIcon, RotateCcw,
  Download, Upload, Eye
} from 'lucide-react'
import { DEFAULT_SETTINGS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSettings } from '@/hooks/useSettings'
import { settingsSections } from '@/components/settings/settingsConfig'
import { SettingField } from '@/components/settings/SettingField'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function SettingsPanel() {
  const {
    settings,
    isLoading,
    updateSetting,
    saveSettings,
    resetSettings,
    hasChanges,
  } = useSettings()

  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setIsSaving(true)
    const success = await saveSettings()
    if (success) {
      toast.success('Settings saved successfully!')
    }
    setIsSaving(false)
  }

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const confirmReset = () => {
    resetSettings()
    setShowResetConfirm(false)
    toast.info('Settings reset to defaults. Save to apply.')
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pharmacy-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Settings exported successfully!')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        const merged = { ...DEFAULT_SETTINGS, ...imported }
        Object.entries(merged).forEach(([key, value]) => {
          if (key in settings) {
            updateSetting(key as keyof typeof settings, value as typeof settings[keyof typeof settings])
          }
        })
        toast.success('Settings imported successfully!')
      } catch {
        toast.error('Invalid settings file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <ConfirmDialog
        isOpen={showResetConfirm}
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
        title="Reset Settings"
        message="Are you sure you want to reset all settings to defaults? You'll need to save to apply the changes."
        confirmLabel="Reset"
        isDestructive
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          {hasChanges && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-amber-600"
            >
              You have unsaved changes
            </motion.p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setShowPreview(!showPreview)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn('btn-secondary', showPreview && 'bg-teal-50 border-teal-300')}
            aria-label="Toggle preview"
          >
            <Eye className="h-4 w-4" />
            Preview
          </motion.button>
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary"
            aria-label="Reset settings to defaults"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </motion.button>
          <motion.button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            whileHover={{ scale: hasChanges ? 1.02 : 1 }}
            whileTap={{ scale: hasChanges ? 0.98 : 1 }}
            className={cn('btn-primary', !hasChanges && 'opacity-50 cursor-not-allowed')}
            aria-label="Save settings"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save</span>
          </motion.button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Settings sections from config */}
          {settingsSections.map((section, sIdx) => {
            const Icon = section.icon
            const hasToggles = section.fields.some(f => f.type === 'toggle')
            const gridFields = section.fields.filter(f => f.type !== 'toggle' && f.type !== 'textarea')
            const fullWidthFields = section.fields.filter(f => f.type === 'textarea')
            const toggleFields = section.fields.filter(f => f.type === 'toggle')

            return (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sIdx * 0.1 }}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', section.iconBg)}>
                    <Icon className={cn('h-5 w-5', section.iconColor)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-500">{section.description}</p>
                  </div>
                </div>

                {fullWidthFields.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {fullWidthFields.map(field => (
                      <SettingField
                        key={field.key}
                        config={field}
                        value={settings[field.key]}
                        onChange={(val) => updateSetting(field.key, val as typeof settings[typeof field.key])}
                      />
                    ))}
                  </div>
                )}

                {gridFields.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {gridFields.map(field => (
                      <SettingField
                        key={field.key}
                        config={field}
                        value={settings[field.key]}
                        onChange={(val) => updateSetting(field.key, val as typeof settings[typeof field.key])}
                      />
                    ))}
                  </div>
                )}

                {hasToggles && (
                  <div className="space-y-4 mt-4">
                    {toggleFields.map(field => (
                      <SettingField
                        key={field.key}
                        config={field}
                        value={settings[field.key]}
                        onChange={(val) => updateSetting(field.key, val as typeof settings[typeof field.key])}
                      />
                    ))}
                  </div>
                )}
              </motion.section>
            )
          })}

          {/* Data management */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <SettingsIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Data Management</h3>
                <p className="text-sm text-gray-500">Import or export your settings</p>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={handleExport}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary flex-1"
                aria-label="Export settings"
              >
                <Download className="h-4 w-4" />
                Export Settings
              </motion.button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary flex-1"
                aria-label="Import settings"
              >
                <Upload className="h-4 w-4" />
                Import Settings
              </motion.button>
            </div>
          </motion.section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-24 space-y-6"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Live Preview</h3>
              <div className="space-y-3">
                <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4">
                  <p
                    className="font-bold text-white truncate"
                    style={{
                      fontSize: settings.display_font_size === 'extra-large' ? '1.5rem' :
                               settings.display_font_size === 'large' ? '1.25rem' :
                               settings.display_font_size === 'medium' ? '1rem' : '0.875rem'
                    }}
                  >
                    {settings.pharmacy_name}
                  </p>
                  <div className="mt-2 rounded-lg bg-white/10 p-2">
                    <p className="text-xs text-white/80 truncate">
                      {settings.patient_board_message}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 p-4">
                  <p className="font-bold text-white">Jo*** Sm***</p>
                  <p className="mt-1 text-sm text-white/80">2 Prescriptions</p>
                  <div className="mt-2 rounded-lg bg-white/20 p-2">
                    <p className="text-xs text-white truncate">
                      {settings.patient_board_message}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Waiter Time</span>
                  <span className="font-medium text-gray-900">{settings.waiter_due_minutes}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Acute Time</span>
                  <span className="font-medium text-gray-900">{settings.acute_due_minutes}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Urgent Time</span>
                  <span className="font-medium text-gray-900">{settings.urgent_due_minutes}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Auto-Clear</span>
                  <span className="font-medium text-gray-900">{settings.auto_clear_minutes}m</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
