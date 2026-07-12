import type { AppSettings, LLMProviderConfig } from '../core/types'
import { STORAGE_KEYS } from '../core/constants'
import { PROVIDER_MODELS } from '../core/constants'
import type { ProviderDescriptor } from '../core/types'

const DEFAULT_SETTINGS: AppSettings = {
  provider: {
    id: 'openai',
    name: 'OpenAI',
    apiKey: '',
    model: 'gpt-4o-mini',
  },
}

export async function getSettings(): Promise<AppSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
  return (result[STORAGE_KEYS.SETTINGS] as AppSettings | undefined) ?? DEFAULT_SETTINGS
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings })
}

export function getProviderDescriptors(): ProviderDescriptor[] {
  return Object.entries(PROVIDER_MODELS).map(([id, models]) => {
    const name = id === 'openai' ? 'OpenAI' : id === 'claude' ? 'Claude' : 'Gemini'
    return { id, name, defaultModel: models[0], models }
  })
}

export function buildProviderConfig(
  id: string,
  apiKey: string,
  model: string,
): LLMProviderConfig {
  const name = id === 'openai' ? 'OpenAI' : id === 'claude' ? 'Claude' : 'Gemini'
  return { id, name, apiKey, model }
}
