'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, DEFAULT_SETTINGS } from '@/lib/types'
import { toast } from 'sonner'

interface UseSettingsResult {
  settings: Settings
  isLoading: boolean
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  saveSettings: () => Promise<boolean>
  resetSettings: () => void
  hasChanges: boolean
  originalSettings: Settings
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          const merged = { ...DEFAULT_SETTINGS, ...data }
          setSettings(merged)
          setOriginalSettings(merged)
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const saveSettings = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setOriginalSettings(settings)
        return true
      }
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Failed to save settings')
      return false
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error('Failed to save settings')
      return false
    }
  }, [settings])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  return { settings, isLoading, updateSetting, saveSettings, resetSettings, hasChanges, originalSettings }
}
