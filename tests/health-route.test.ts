import test from 'node:test'
import assert from 'node:assert/strict'

import { GET } from '../app/api/health/route'

const originalEnv = {
  APP_MODE: process.env.APP_MODE,
  DATABASE_URL: process.env.DATABASE_URL,
  NNRXOS_DATABASE_URL: process.env.NNRXOS_DATABASE_URL,
}

function setEnv(values: Partial<NodeJS.ProcessEnv>) {
  if (values.APP_MODE === undefined) delete process.env.APP_MODE
  else process.env.APP_MODE = values.APP_MODE

  if (values.DATABASE_URL === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = values.DATABASE_URL

  if (values.NNRXOS_DATABASE_URL === undefined) delete process.env.NNRXOS_DATABASE_URL
  else process.env.NNRXOS_DATABASE_URL = values.NNRXOS_DATABASE_URL
}

test('health endpoint exposes integrated readiness and db mode', async () => {
  try {
    setEnv({
      APP_MODE: 'integrated',
      DATABASE_URL: 'postgres://standalone-db',
      NNRXOS_DATABASE_URL: 'postgres://integrated-db',
    })

    const response = await GET()
    const payload = await response.json() as {
      app_mode: string
      db_mode: string
      ready: boolean
      integrated_ready: boolean
      database_url_source: string | null
      validation_errors: string[]
    }

    assert.equal(response.status, 200)
    assert.equal(payload.app_mode, 'integrated')
    assert.equal(payload.db_mode, 'integrated')
    assert.equal(payload.ready, true)
    assert.equal(payload.integrated_ready, true)
    assert.equal(payload.database_url_source, 'NNRXOS_DATABASE_URL')
    assert.deepEqual(payload.validation_errors, [])
  } finally {
    setEnv(originalEnv)
  }
})

test('health endpoint returns a degraded response in standalone mode without an integrated url', async () => {
  try {
    setEnv({
      APP_MODE: 'standalone',
      DATABASE_URL: 'postgres://standalone-db',
      NNRXOS_DATABASE_URL: undefined,
    })

    const response = await GET()
    const payload = await response.json() as {
      app_mode: string
      db_mode: string
      ready: boolean
      integrated_ready: boolean
      database_url_source: string | null
      validation_errors: string[]
    }

    assert.equal(response.status, 200)
    assert.equal(payload.app_mode, 'standalone')
    assert.equal(payload.db_mode, 'standalone')
    assert.equal(payload.ready, true)
    assert.equal(payload.integrated_ready, false)
    assert.equal(payload.database_url_source, 'DATABASE_URL')
    assert.deepEqual(payload.validation_errors, [])
  } finally {
    setEnv(originalEnv)
  }
})

test('health endpoint reports degraded readiness for integrated mode without the integrated url', async () => {
  try {
    setEnv({
      APP_MODE: 'integrated',
      DATABASE_URL: 'postgres://standalone-db',
      NNRXOS_DATABASE_URL: undefined,
    })

    const response = await GET()
    const payload = await response.json() as {
      app_mode: string
      db_mode: string
      ready: boolean
      integrated_ready: boolean
      database_url_source: string | null
      validation_errors: string[]
    }

    assert.equal(response.status, 503)
    assert.equal(payload.app_mode, 'integrated')
    assert.equal(payload.db_mode, 'integrated')
    assert.equal(payload.ready, false)
    assert.equal(payload.integrated_ready, false)
    assert.equal(payload.database_url_source, null)
    assert.equal(payload.validation_errors[0], 'NNRXOS_DATABASE_URL is required when APP_MODE=integrated.')
  } finally {
    setEnv(originalEnv)
  }
})
