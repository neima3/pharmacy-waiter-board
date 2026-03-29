import { Settings } from '@/lib/types'
import { Clock, Building2, Monitor, Palette } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export type FieldType = 'number' | 'text' | 'textarea' | 'select' | 'toggle'

export interface SettingFieldConfig {
  key: keyof Settings
  label: string
  description?: string
  type: FieldType
  min?: number
  max?: number
  placeholder?: string
  options?: { value: string; label: string }[]
}

export interface SettingSectionConfig {
  title: string
  description: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  fields: SettingFieldConfig[]
}

export const settingsSections: SettingSectionConfig[] = [
  {
    title: 'Timing Settings',
    description: 'Configure order due times',
    icon: Clock,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    fields: [
      { key: 'waiter_due_minutes', label: 'Waiter Due Time (minutes)', type: 'number', min: 5, max: 120 },
      { key: 'acute_due_minutes', label: 'Acute Due Time (minutes)', type: 'number', min: 5, max: 240 },
      { key: 'urgent_due_minutes', label: 'Urgent Mail Due Time (minutes)', type: 'number', min: 5, max: 240 },
      { key: 'auto_clear_minutes', label: 'Auto-Clear Time (minutes)', description: 'How long after "Ready" before removal', type: 'number', min: 5, max: 180 },
    ],
  },
  {
    title: 'Pharmacy Information',
    description: 'Your pharmacy details',
    icon: Building2,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    fields: [
      { key: 'pharmacy_name', label: 'Pharmacy Name', type: 'text', placeholder: 'Community Pharmacy' },
      { key: 'display_name', label: 'Display Name', type: 'text', placeholder: 'Pharmacy Waiter Board' },
    ],
  },
  {
    title: 'Patient Board Settings',
    description: 'Customize the public display',
    icon: Monitor,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    fields: [
      { key: 'patient_board_message', label: 'Ready Message', type: 'textarea', placeholder: 'Your order is ready - Please see the pharmacist' },
      { key: 'display_font_size', label: 'Display Font Size', type: 'select', options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'extra-large', label: 'Extra Large' },
      ]},
      { key: 'patient_board_refresh_rate', label: 'Refresh Rate (seconds)', type: 'number', min: 5, max: 60 },
    ],
  },
  {
    title: 'Display Settings',
    description: 'Visual preferences',
    icon: Palette,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    fields: [
      { key: 'dark_mode', label: 'Dark Mode', description: 'Enable dark mode for patient board', type: 'toggle' },
      { key: 'sound_notifications', label: 'Sound Notifications', description: 'Play sound when new orders are ready', type: 'toggle' },
    ],
  },
]
