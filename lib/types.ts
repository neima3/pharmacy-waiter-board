export type OrderType = 'waiter' | 'acute' | 'urgent_mail'

export interface Patient {
  id: number
  mrn: string
  first_name: string
  last_name: string
  dob: string
  created_at: string
}

export interface WaiterRecord {
  id: number
  mrn: string
  first_name: string
  last_name: string
  dob: string
  num_prescriptions: number
  comments: string
  initials: string
  order_type: OrderType
  due_time: string
  created_at: string
  printed: boolean
  ready: boolean
  ready_at: string | null
  completed: boolean
}

export interface Settings {
  waiter_due_minutes: number
  acute_due_minutes: number
  urgent_due_minutes: number
  auto_clear_minutes: number
  pharmacy_name: string
  display_name: string
  waiter_color: string
  acute_color: string
  urgent_color: string
  patient_board_message: string
  patient_board_refresh_rate: number
  display_font_size: string
  dark_mode: boolean
  sound_notifications: boolean
}

export interface AuditLog {
  id: number
  record_id: number
  action: string
  old_values: string
  new_values: string
  staff_initials: string
  timestamp: string
}

export const DEFAULT_SETTINGS: Settings = {
  waiter_due_minutes: 30,
  acute_due_minutes: 60,
  urgent_due_minutes: 60,
  auto_clear_minutes: 45,
  pharmacy_name: 'Community Pharmacy',
  display_name: 'Pharmacy Waiter Board',
  waiter_color: '#22c55e',
  acute_color: '#3b82f6',
  urgent_color: '#a855f7',
  patient_board_message: 'Your order is ready - Please see the pharmacist',
  patient_board_refresh_rate: 10,
  display_font_size: 'large',
  dark_mode: false,
  sound_notifications: false,
}
