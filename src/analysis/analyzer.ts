import type { LLMProviderConfig, AnalysisResult } from '../core/types'
import type { LLMProvider } from './providers/interface'
import { openaiProvider } from './providers/openai'
import { claudeProvider } from './providers/claude'
import { geminiProvider } from './providers/gemini'

const providers: Record<string, LLMProvider> = {
  openai: openaiProvider,
  claude: claudeProvider,
  gemini: geminiProvider,
}

export function getProvider(id: string): LLMProvider | undefined {
  return providers[id]
}

export function getAllProviders(): LLMProvider[] {
  return Object.values(providers)
}

export async function analyzeText(
  text: string,
  url: string,
  title: string,
  config: LLMProviderConfig,
  retries = 2,
): Promise<AnalysisResult> {
  const provider = getProvider(config.id)
  if (!provider) throw new Error(`Unknown provider: ${config.id}`)

  let lastError: Error | undefined
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await provider.analyze(text, config)
      result.url = url
      result.title = title
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
      }
    }
  }
  throw lastError!
}
