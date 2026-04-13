export type AppMode = 'standalone' | 'integrated' | 'auto'

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
