export type ValidationResult = { valid: true } | { valid: false; message: string }

export function validateMRN(mrn: string): ValidationResult {
  if (!mrn) return { valid: true }
  if (mrn.length > 20) return { valid: false, message: 'MRN must be 20 characters or less' }
  if (!/^[A-Za-z0-9-]+$/.test(mrn)) return { valid: false, message: 'MRN must be alphanumeric' }
  return { valid: true }
}

export function validateName(name: string, field: string): ValidationResult {
  if (!name.trim()) return { valid: false, message: `${field} is required` }
  if (name.length > 100) return { valid: false, message: `${field} must be 100 characters or less` }
  return { valid: true }
}

export function validateInitials(initials: string): ValidationResult {
  if (!initials.trim()) return { valid: false, message: 'Initials are required' }
  if (!/^[A-Za-z]{2,4}$/.test(initials)) return { valid: false, message: 'Initials must be 2-4 letters' }
  return { valid: true }
}

export function validateOrderType(type: string): ValidationResult {
  const valid = ['waiter', 'acute', 'urgent_mail', 'mail']
  if (!valid.includes(type)) return { valid: false, message: `Invalid order type: ${type}` }
  return { valid: true }
}

export function validateComments(text: string): ValidationResult {
  if (text.length > 500) return { valid: false, message: 'Comments must be 500 characters or less' }
  return { valid: true }
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }
    return map[c] || c
  })
}

export function validateRecord(body: Record<string, unknown>): { valid: true } | { valid: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {}

  const mrnResult = validateMRN(String(body.mrn || ''))
  if (!mrnResult.valid) fields.mrn = mrnResult.message

  const fnResult = validateName(String(body.first_name || ''), 'First name')
  if (!fnResult.valid) fields.first_name = fnResult.message

  const lnResult = validateName(String(body.last_name || ''), 'Last name')
  if (!lnResult.valid) fields.last_name = lnResult.message

  const initResult = validateInitials(String(body.initials || ''))
  if (!initResult.valid) fields.initials = initResult.message

  const otResult = validateOrderType(String(body.order_type || 'waiter'))
  if (!otResult.valid) fields.order_type = otResult.message

  const comResult = validateComments(String(body.comments || ''))
  if (!comResult.valid) fields.comments = comResult.message

  return Object.keys(fields).length === 0 ? { valid: true } : { valid: false, fields }
}
