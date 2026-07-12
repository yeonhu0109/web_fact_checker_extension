import type { AnalysisResult, LLMProviderConfig } from '../../core/types'

export interface LLMProvider {
  readonly id: string
  readonly name: string
  readonly defaultModel: string
  analyze(text: string, config: LLMProviderConfig): Promise<AnalysisResult>
}
