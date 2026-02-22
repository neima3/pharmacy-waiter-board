'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, RefreshCw, Settings as SettingsIcon } from 'lucide-react'
import { Settings, DEFAULT_SETTINGS } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings({ ...DEFAULT_SETTINGS, ...data })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        setSaveMessage('Settings saved successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveMessage('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
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
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <div className="flex items-center gap-4">
          {saveMessage && (
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                'text-sm font-medium',
                saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
              )}
            >
              {saveMessage}
            </motion.span>
          )}
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <SettingsIcon className="h-5 w-5 text-teal-600" />
            Timing Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Waiter Due Time (minutes)
              </label>
              <input
                type="number"
                value={settings.waiter_due_minutes}
                onChange={(e) => updateSetting('waiter_due_minutes', parseInt(e.target.value) || 30)}
                className="input-field mt-1"
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Auto-Clear Time (minutes)
              </label>
              <p className="text-xs text-gray-500">How long after &quot;Ready&quot; before auto-removal from patient board</p>
              <input
                type="number"
                value={settings.auto_clear_minutes}
                onChange={(e) => updateSetting('auto_clear_minutes', parseInt(e.target.value) || 45)}
                className="input-field mt-1"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Pharmacy Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pharmacy Name
              </label>
              <input
                type="text"
                value={settings.pharmacy_name}
                onChange={(e) => updateSetting('pharmacy_name', e.target.value)}
                className="input-field mt-1"
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
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Patient Board Settings</h3>
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
              />
            </div>
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
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Display Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Dark Mode</label>
                <p className="text-xs text-gray-500">Enable dark mode for patient board</p>
              </div>
              <button
                onClick={() => updateSetting('dark_mode', !settings.dark_mode)}
                className={cn(
                  'relative h-7 w-14 rounded-full transition-colors',
                  settings.dark_mode ? 'bg-teal-600' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform',
                    settings.dark_mode && 'translate-x-7'
                  )}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sound Notifications</label>
                <p className="text-xs text-gray-500">Play sound when new orders are added</p>
              </div>
              <button
                onClick={() => updateSetting('sound_notifications', !settings.sound_notifications)}
                className={cn(
                  'relative h-7 w-14 rounded-full transition-colors',
                  settings.sound_notifications ? 'bg-teal-600' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform',
                    settings.sound_notifications && 'translate-x-7'
                  )}
                />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
