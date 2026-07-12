// ─── Fact-checking types ───

export interface AnalysisRequest {
  tabId: number
  url: string
  title: string
  textContent: string
}

export interface AnalysisResult {
  id: string
  timestamp: number
  url: string
  title: string
  overallScore: number | null
  statements: StatementResult[]
  summary: string
}

export interface StatementResult {
  text: string
  score: number
  label: FactLabel
  explanation: string
  citations?: string[]
}

export type FactLabel =
  | 'true'
  | 'mostly_true'
  | 'unverified'
  | 'mostly_false'
  | 'false'
  | 'opinion'

// ─── LLM Provider ───

export interface LLMProviderConfig {
  id: string
  name: string
  apiKey: string
  model: string
  baseUrl?: string
}

export interface LLMProvider {
  readonly id: string
  readonly name: string
  readonly defaultModel: string
  analyze(text: string, config: LLMProviderConfig): Promise<AnalysisResult>
}

// ─── Settings ───

export interface AppSettings {
  provider: LLMProviderConfig
}

// ─── Export ───

export type ExportFormat = 'json' | 'text'

// ─── Highlight ───

export interface HighlightData {
  text: string
  score: number
  label: FactLabel
}

// ─── Provider descriptor for popup ───

export interface ProviderDescriptor {
  id: string
  name: string
  defaultModel: string
  models: string[]
}
