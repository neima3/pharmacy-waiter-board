export type AppMode = 'standalone' | 'integrated' | 'auto'

export type DatabaseUrlSource = 'DATABASE_URL' | 'NNRXOS_DATABASE_URL' | null

export interface EnvironmentHealth {
  app_mode: AppMode
  db_mode: AppMode
  ready: boolean
  integrated_ready: boolean
  database_url_source: DatabaseUrlSource
  validation_errors: string[]
}

function readEnvValue(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function getAppMode(env: NodeJS.ProcessEnv = process.env): AppMode {
  const raw = env.APP_MODE?.trim()

  if (!raw) return 'auto'

  switch (raw.toLowerCase()) {
    case 'standalone':
    case 'integrated':
    case 'auto':
      return raw.toLowerCase() as AppMode
    default:
      throw new Error('APP_MODE must be one of: standalone, integrated, auto.')
  }
}

export function getEnvironmentHealth(env: NodeJS.ProcessEnv = process.env): EnvironmentHealth {
  const appMode = getAppMode(env)
  const standaloneUrl = readEnvValue(env, 'DATABASE_URL')
  const integratedUrl = readEnvValue(env, 'NNRXOS_DATABASE_URL')
  const validationErrors: string[] = []

  if (appMode === 'standalone') {
    if (!standaloneUrl) validationErrors.push('DATABASE_URL is required when APP_MODE=standalone.')
    return {
      app_mode: appMode,
      db_mode: 'standalone',
      ready: validationErrors.length === 0,
      integrated_ready: false,
      database_url_source: standaloneUrl ? 'DATABASE_URL' : null,
      validation_errors: validationErrors,
    }
  }

  if (appMode === 'integrated') {
    if (!integratedUrl) validationErrors.push('NNRXOS_DATABASE_URL is required when APP_MODE=integrated.')
    return {
      app_mode: appMode,
      db_mode: 'integrated',
      ready: integratedUrl.length > 0,
      integrated_ready: integratedUrl.length > 0,
      database_url_source: integratedUrl ? 'NNRXOS_DATABASE_URL' : null,
      validation_errors: validationErrors,
    }
  }

  if (integratedUrl) {
    return {
      app_mode: appMode,
      db_mode: 'integrated',
      ready: true,
      integrated_ready: true,
      database_url_source: 'NNRXOS_DATABASE_URL',
      validation_errors: validationErrors,
    }
  }

  if (standaloneUrl) {
    return {
      app_mode: appMode,
      db_mode: 'standalone',
      ready: true,
      integrated_ready: false,
      database_url_source: 'DATABASE_URL',
      validation_errors: validationErrors,
    }
  }

  validationErrors.push('Set NNRXOS_DATABASE_URL or DATABASE_URL before connecting to the database.')
  return {
    app_mode: appMode,
    db_mode: 'auto',
    ready: false,
    integrated_ready: false,
    database_url_source: null,
    validation_errors: validationErrors,
  }
}

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const appMode = getAppMode(env)
  const standaloneUrl = readEnvValue(env, 'DATABASE_URL')
  const integratedUrl = readEnvValue(env, 'NNRXOS_DATABASE_URL')

  if (appMode === 'standalone') {
    if (!standaloneUrl) {
      throw new Error('DATABASE_URL is required when APP_MODE=standalone.')
    }
    return standaloneUrl
  }

  if (appMode === 'integrated') {
    if (!integratedUrl) {
      throw new Error('NNRXOS_DATABASE_URL is required when APP_MODE=integrated.')
    }
    return integratedUrl
  }

  return integratedUrl || standaloneUrl || (() => {
    throw new Error('Set NNRXOS_DATABASE_URL or DATABASE_URL before connecting to the database.')
  })()
}
