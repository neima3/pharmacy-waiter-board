'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save, RefreshCw, Settings as SettingsIcon, RotateCcw, 
  Download, Upload, Check, AlertCircle, Clock, Building2,
  Monitor, Volume2, Moon, Palette, Eye
} from 'lucide-react'
import { Settings, DEFAULT_SETTINGS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings))
  }, [settings, originalSettings])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings({ ...DEFAULT_SETTINGS, ...data })
      setOriginalSettings({ ...DEFAULT_SETTINGS, ...data })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    console.log('Saving settings:', settings)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      const data = await response.json()
      console.log('Save response:', response.status, data)
      
      if (response.ok) {
        toast.success('Settings saved successfully!')
        setOriginalSettings(settings)
      } else {
        const errorMsg = data.error || data.details || 'Failed to save settings'
        console.error('Save failed:', errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(DEFAULT_SETTINGS)
      toast.info('Settings reset to defaults. Save to apply.')
    }
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
        setSettings({ ...DEFAULT_SETTINGS, ...imported })
        toast.success('Settings imported successfully!')
      } catch {
        toast.error('Invalid settings file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
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
          >
            <Eye className="h-4 w-4" />
            Preview
          </motion.button>
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary"
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
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save</span>
          </motion.button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Timing Settings</h3>
                <p className="text-sm text-gray-500">Configure order due times</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Waiter Due Time (minutes)
                </label>
                <input
                  type="number"
                  value={settings.waiter_due_minutes}
                  onChange={(e) => updateSetting('waiter_due_minutes', parseInt(e.target.value) || 30)}
                  className="input-field mt-1"
                  min={5}
                  max={120}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Acute Due Time (minutes)
                </label>
                <input
                  type="number"
                  value={settings.acute_due_minutes}
                  onChange={(e) => updateSetting('acute_due_minutes', parseInt(e.target.value) || 60)}
                  className="input-field mt-1"
                  min={5}
                  max={240}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Urgent Mail Due Time (minutes)
                </label>
                <input
                  type="number"
                  value={settings.urgent_due_minutes}
                  onChange={(e) => updateSetting('urgent_due_minutes', parseInt(e.target.value) || 60)}
                  className="input-field mt-1"
                  min={5}
                  max={240}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Auto-Clear Time (minutes)
                </label>
                <p className="text-xs text-gray-400">How long after &quot;Ready&quot; before removal</p>
                <input
                  type="number"
                  value={settings.auto_clear_minutes}
                  onChange={(e) => updateSetting('auto_clear_minutes', parseInt(e.target.value) || 45)}
                  className="input-field mt-1"
                  min={5}
                  max={180}
                />
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pharmacy Information</h3>
                <p className="text-sm text-gray-500">Your pharmacy details</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pharmacy Name
                </label>
                <input
                  type="text"
                  value={settings.pharmacy_name}
                  onChange={(e) => updateSetting('pharmacy_name', e.target.value)}
                  className="input-field mt-1"
                  placeholder="Community Pharmacy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  type="text"
                  value={settings.display_name}
                  onChange={(e) => updateSetting('display_name', e.target.value)}
                  className="input-field mt-1"
                  placeholder="Pharmacy Waiter Board"
                />
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <Monitor className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Patient Board Settings</h3>
                <p className="text-sm text-gray-500">Customize the public display</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ready Message
                </label>
                <textarea
                  value={settings.patient_board_message}
                  onChange={(e) => updateSetting('patient_board_message', e.target.value)}
                  rows={2}
                  className="input-field mt-1 resize-none"
                  placeholder="Your order is ready - Please see the pharmacist"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Display Font Size
                  </label>
                  <select
                    value={settings.display_font_size}
                    onChange={(e) => updateSetting('display_font_size', e.target.value)}
                    className="input-field mt-1"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Refresh Rate (seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.patient_board_refresh_rate}
                    onChange={(e) => updateSetting('patient_board_refresh_rate', parseInt(e.target.value) || 10)}
                    className="input-field mt-1"
                    min={5}
                    max={60}
                  />
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Palette className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Display Settings</h3>
                <p className="text-sm text-gray-500">Visual preferences</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-gray-500" />
                  <div>
                    <label className="font-medium text-gray-700">Dark Mode</label>
                    <p className="text-sm text-gray-500">Enable dark mode for patient board</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => updateSetting('dark_mode', !settings.dark_mode)}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'relative h-7 w-14 rounded-full transition-colors',
                    settings.dark_mode ? 'bg-teal-600' : 'bg-gray-300'
                  )}
                >
                  <motion.span
                    animate={{ x: settings.dark_mode ? 28 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm"
                  />
                </motion.button>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <label className="font-medium text-gray-700">Sound Notifications</label>
                    <p className="text-sm text-gray-500">Play sound when new orders are ready</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => updateSetting('sound_notifications', !settings.sound_notifications)}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'relative h-7 w-14 rounded-full transition-colors',
                    settings.sound_notifications ? 'bg-teal-600' : 'bg-gray-300'
                  )}
                >
                  <motion.span
                    animate={{ x: settings.sound_notifications ? 28 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm"
                  />
                </motion.button>
              </div>
            </div>
          </motion.section>

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
              >
                <Upload className="h-4 w-4" />
                Import Settings
              </motion.button>
            </div>
          </motion.section>
        </div>

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
