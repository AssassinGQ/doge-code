import { getSecureStorage } from './secureStorage/index.js'

export type OpenAICompatMode = 'chat_completions' | 'responses'

const VALID_PROVIDERS = ['anthropic', 'openai', 'gemini'] as const
export type CustomApiProvider = typeof VALID_PROVIDERS[number]

export type CustomApiStorageData = {
  provider?: CustomApiProvider
  providers?: Record<string, CustomApiProvider>
  openaiCompatMode?: OpenAICompatMode
  baseURL?: string
  apiKey?: string
  model?: string
  savedModels?: string[]
}

const CUSTOM_API_STORAGE_KEY = 'customApiEndpoint'

function parseProviders(
  raw: unknown,
): Record<string, CustomApiProvider> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const entries = Object.entries(raw as Record<string, unknown>)
  if (entries.length === 0) return undefined
  const parsed: Record<string, CustomApiProvider> = {}
  for (const [key, val] of entries) {
    if (VALID_PROVIDERS.includes(val as string)) {
      parsed[key] = val as CustomApiProvider
    }
  }
  return Object.keys(parsed).length > 0 ? parsed : undefined
}

export function readCustomApiStorage(): CustomApiStorageData {
  const storage = getSecureStorage() as {
    read?: () => Record<string, unknown> | null
    update?: (data: Record<string, unknown>) => { success: boolean }
  }
  const data = storage.read?.() ?? {}
  const raw = data[CUSTOM_API_STORAGE_KEY]
  if (!raw || typeof raw !== 'object') return {}
  const value = raw as Record<string, unknown>
  const provider = VALID_PROVIDERS.includes(value.provider as string)
    ? (value.provider as CustomApiProvider)
    : undefined
  const openaiCompatMode =
    value.openaiCompatMode === 'chat_completions' || value.openaiCompatMode === 'responses'
      ? value.openaiCompatMode
      : provider === 'openai'
        ? 'chat_completions'
        : undefined

  return {
    provider,
    providers: parseProviders(value.providers),
    openaiCompatMode,
    baseURL: typeof value.baseURL === 'string' ? value.baseURL : undefined,
    apiKey: typeof value.apiKey === 'string' ? value.apiKey : undefined,
    model: typeof value.model === 'string' ? value.model : undefined,
    savedModels: Array.isArray(value.savedModels)
      ? value.savedModels.filter((item): item is string => typeof item === 'string')
      : [],
  }
}

export function writeCustomApiStorage(next: CustomApiStorageData): void {
  const storage = getSecureStorage() as {
    read?: () => Record<string, unknown> | null
    update?: (data: Record<string, unknown>) => { success: boolean }
  }
  const current = storage.read?.() ?? {}
  storage.update?.({
    ...current,
    customApiEndpoint: next,
  })
}

export function clearCustomApiStorage(): void {
  const storage = getSecureStorage() as {
    read?: () => Record<string, unknown> | null
    update?: (data: Record<string, unknown>) => { success: boolean }
  }
  const current = storage.read?.() ?? {}
  const { customApiEndpoint: _, ...rest } = current
  storage.update?.(rest)
}
