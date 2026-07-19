import type { PopupToBackground, BackgroundToPopup, BackgroundToContent } from './core/messages'
import { openaiProvider } from './analysis/providers/openai'
import { claudeProvider } from './analysis/providers/claude'
import { geminiProvider } from './analysis/providers/gemini'
import { getSettings, saveSettings, getProviderDescriptors } from './storage/settings-store'
import { saveResult, getHistoryIndex, getResult, deleteResult } from './storage/history-store'
import type { AnalysisResult, AppSettings } from './core/types'
import type { LLMProvider } from './analysis/providers/interface'

const providers: Record<string, LLMProvider> = {
  openai: openaiProvider,
  claude: claudeProvider,
  gemini: geminiProvider,
}

console.log('[Background] Service worker started')

chrome.runtime.onMessage.addListener(
  (message: PopupToBackground, _sender, sendResponse) => {
    switch (message.type) {
      case 'ANALYZE_PAGE':
        handleAnalyzePage(sendResponse)
        return true
      case 'GET_HISTORY':
        handleGetHistory(sendResponse)
        return true
      case 'GET_RESULT':
        handleGetResult(message.resultId, sendResponse)
        return true
      case 'SAVE_SETTINGS':
        handleSaveSettings(message.settings, sendResponse)
        return true
      case 'GET_SETTINGS':
        handleGetSettings(sendResponse)
        return true
      case 'DELETE_RESULT':
        handleDeleteResult(message.resultId, sendResponse)
        return true
      case 'EXPORT_RESULT':
        handleExportResult(message.resultId, message.format, sendResponse)
        return true
      case 'GET_PROVIDERS':
        sendResponse({ type: 'PROVIDERS_LIST', providers: getProviderDescriptors() } as BackgroundToPopup)
        return false
    }
  },
)

async function handleAnalyzePage(sendResponse: (response: BackgroundToPopup) => void): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id || !tab.url) {
      sendResponse({ type: 'ANALYSIS_ERROR', error: '활성 탭을 찾을 수 없습니다.' })
      return
    }

    let textContent = ''
    let title = tab.title ?? ''

    try {
      const contentResponse = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACTED_CONTENT' })
      if (contentResponse && typeof contentResponse === 'object' && 'text' in contentResponse) {
        textContent = (contentResponse as { text: string }).text
      }
    } catch {
      // content script not loaded yet, try scripting API
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.body?.innerText ?? '',
        })
        textContent = results[0]?.result ?? ''
        title = tab.title ?? ''
      } catch {
        // fallback: use whatever we have
      }
    }

    if (!textContent || textContent.length < 50) {
      sendResponse({ type: 'ANALYSIS_ERROR', error: '페이지에서 분석할 내용을 찾을 수 없습니다.' })
      return
    }

    const settings = await getSettings()
    if (!settings.provider.apiKey) {
      sendResponse({ type: 'ANALYSIS_ERROR', error: '설정에서 API 키를 먼저 입력해주세요.' })
      return
    }

    const provider = providers[settings.provider.id]
    if (!provider) {
      sendResponse({ type: 'ANALYSIS_ERROR', error: `지원하지 않는 Provider입니다: ${settings.provider.id}` })
      return
    }

    const result = await provider.analyze(textContent, settings.provider)
    result.url = tab.url
    result.title = title

    await saveResult(result)

    // Send highlights to content script
    const highlights = result.statements.map(      (s: { label: string; score: number; text: string }) => ({ text: s.text, score: s.score, label: s.label }))
    chrome.tabs.sendMessage(tab.id, { type: 'APPLY_HIGHLIGHTS', highlights } as BackgroundToContent).catch(() => {
      // content script may not be ready, ignore
    })

    sendResponse({ type: 'ANALYSIS_COMPLETE', result })
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)

    // Translate common API errors into user-friendly Korean messages
    let message: string
    if (raw.includes('429') || raw.includes('quota') || raw.includes('RESOURCE_EXHAUSTED')) {
      message = `API 할당량이 초과되었습니다. 잠시 후 다시 시도하거나 설정에서 다른 Provider로 변경해보세요.`
    } else if (raw.includes('401') || raw.includes('unauthorized') || raw.includes('API key')) {
      message = `API 키가 올바르지 않습니다. 설정에서 API 키를 확인해주세요.`
    } else if (raw.includes('500') || raw.includes('service')) {
      message = `API 서버에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`
    } else {
      message = raw
    }
    sendResponse({ type: 'ANALYSIS_ERROR', error: message })
  }
}

async function handleGetHistory(sendResponse: (response: BackgroundToPopup) => void): Promise<void> {
  const items = await getHistoryIndex()
  const results: AnalysisResult[] = []
  for (const item of items) {
    const result = await getResult(item.id)
    if (result) results.push(result)
  }
  sendResponse({ type: 'HISTORY_DATA', items: results })
}

async function handleGetResult(resultId: string, sendResponse: (response: BackgroundToPopup) => void): Promise<void> {
  const result = await getResult(resultId)
  sendResponse({ type: 'RESULT_DATA', result })
}

async function handleSaveSettings(settings: AppSettings, sendResponse: (response: BackgroundToPopup) => void): Promise<void> {
  await saveSettings(settings)
  sendResponse({ type: 'SETTINGS_DATA', settings })
}

async function handleGetSettings(sendResponse: (response: BackgroundToPopup) => void): Promise<void> {
  const settings = await getSettings()
  sendResponse({ type: 'SETTINGS_DATA', settings })
}

async function handleDeleteResult(resultId: string, sendResponse: (response: BackgroundToPopup) => void): Promise<void> {
  await deleteResult(resultId)
  sendResponse({ type: 'HISTORY_DATA', items: [] })
  // Re-fetch history after deletion
  const items = await getHistoryIndex()
  const results: AnalysisResult[] = []
  for (const item of items) {
    const result = await getResult(item.id)
    if (result) results.push(result)
  }
  sendResponse({ type: 'HISTORY_DATA', items: results })
}

async function handleExportResult(
  resultId: string,
  format: 'json' | 'text',
  sendResponse: (response: BackgroundToPopup) => void,
): Promise<void> {
  const result = await getResult(resultId)
  if (!result) {
    sendResponse({ type: 'EXPORT_DATA', content: '', format })
    return
  }

  let content: string
  if (format === 'json') {
    content = JSON.stringify(result, null, 2)
  } else {
    const lines = result.statements.map(
      (s) => `[${s.label}] (${(s.score * 100).toFixed(0)}%) ${s.text}\n  → ${s.explanation}`,
    )
    content = [
      `URL: ${result.url}`,
      `제목: ${result.title}`,
      `분석일: ${new Date(result.timestamp).toLocaleString('ko-KR')}`,
      `전체 신뢰도: ${result.overallScore !== null ? `${(result.overallScore * 100).toFixed(0)}%` : 'N/A'}`,
      '',
      ...lines,
    ].join('\n')
  }

  sendResponse({ type: 'EXPORT_DATA', content, format })
}
