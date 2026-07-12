import type { AnalysisResult, AppSettings, ExportFormat, HighlightData, ProviderDescriptor } from './types'

// ─── Popup → Background ───

export type PopupToBackground =
  | { type: 'ANALYZE_PAGE' }
  | { type: 'GET_HISTORY' }
  | { type: 'GET_RESULT'; resultId: string }
  | { type: 'SAVE_SETTINGS'; settings: AppSettings }
  | { type: 'GET_SETTINGS' }
  | { type: 'DELETE_RESULT'; resultId: string }
  | { type: 'EXPORT_RESULT'; resultId: string; format: ExportFormat }
  | { type: 'GET_PROVIDERS' }

// ─── Background → Popup ───

export type BackgroundToPopup =
  | { type: 'ANALYSIS_COMPLETE'; result: AnalysisResult }
  | { type: 'ANALYSIS_ERROR'; error: string }
  | { type: 'HISTORY_DATA'; items: AnalysisResult[] }
  | { type: 'RESULT_DATA'; result: AnalysisResult | null }
  | { type: 'SETTINGS_DATA'; settings: AppSettings }
  | { type: 'EXPORT_DATA'; content: string; format: ExportFormat }
  | { type: 'PROVIDERS_LIST'; providers: ProviderDescriptor[] }

// ─── Background → Content ───

export type BackgroundToContent =
  | { type: 'APPLY_HIGHLIGHTS'; highlights: HighlightData[] }
  | { type: 'CLEAR_HIGHLIGHTS' }

// ─── Content → Background ───

export type ContentToBackground =
  | { type: 'SELECTION_TEXT'; text: string }
  | { type: 'EXTRACTED_CONTENT'; text: string; title: string }

// ─── Popup → Content (via chrome.tabs.sendMessage) ───

export type PopupToContent =
  | { type: 'GET_SELECTION' }
