import test from 'node:test'
import assert from 'node:assert/strict'

import { getEnvironmentHealth, getAppMode, resolveDatabaseUrl } from '../lib/db-mode'

test('reports standalone readiness without requiring the integrated url', () => {
  const env = {
    APP_MODE: 'standalone',
    DATABASE_URL: 'postgres://standalone-db',
  } as unknown as NodeJS.ProcessEnv

  const health = getEnvironmentHealth(env)

  assert.equal(getAppMode(env), 'standalone')
  assert.deepEqual(health, {
    app_mode: 'standalone',
    db_mode: 'standalone',
    ready: true,
    integrated_ready: false,
    database_url_source: 'DATABASE_URL',
    validation_errors: [],
  })
  assert.equal(resolveDatabaseUrl(env), 'postgres://standalone-db')
})

test('reports integrated readiness only when the integrated url is configured', () => {
  const env = {
    APP_MODE: 'integrated',
    DATABASE_URL: 'postgres://standalone-db',
  } as unknown as NodeJS.ProcessEnv

  const health = getEnvironmentHealth(env)

  assert.equal(getAppMode(env), 'integrated')
  assert.equal(health.app_mode, 'integrated')
  assert.equal(health.db_mode, 'integrated')
  assert.equal(health.ready, false)
  assert.equal(health.integrated_ready, false)
  assert.equal(health.database_url_source, null)
  assert.equal(health.validation_errors.length, 1)
  assert.match(health.validation_errors[0], /NNRXOS_DATABASE_URL/)
})
