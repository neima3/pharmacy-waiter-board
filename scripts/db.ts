import { neon } from '@neondatabase/serverless'
import { resolveDatabaseUrl } from '../lib/db-mode'

type NeonOptions = Parameters<typeof neon>[1]

export function getDatabaseUrl() {
  return resolveDatabaseUrl()
}

export function createSqlClient(options?: NeonOptions) {
  return neon(getDatabaseUrl(), options)
}
