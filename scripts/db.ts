import { neon } from '@neondatabase/serverless'

type NeonOptions = Parameters<typeof neon>[1]

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim()

  if (!url) {
    throw new Error(
      'DATABASE_URL is required. Set it in your shell or copy .env.example to .env.local before running scripts.'
    )
  }

  return url
}

export function createSqlClient(options?: NeonOptions) {
  return neon(getDatabaseUrl(), options)
}
