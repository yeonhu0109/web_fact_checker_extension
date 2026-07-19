export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  HISTORY_INDEX: 'history_index',
  RESULT_PREFIX: 'result_',
} as const

export const MAX_HISTORY_ITEMS = 50

export const ANALYSIS_TEMPERATURE = 0.3
export const ANALYSIS_RETRY_TEMPERATURE = 0.0
export const MAX_RETRIES = 2
export const RETRY_DELAY_MS = 2000

export const MIN_TEXT_LENGTH = 50

export const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  claude: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
  gemini: ['gemini-flash-latest'],
}
