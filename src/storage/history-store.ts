import type { AnalysisResult } from '../core/types'
import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../core/constants'

interface HistoryIndexItem {
  id: string
  url: string
  title: string
  timestamp: number
  overallScore: number | null
}

export async function saveResult(result: AnalysisResult): Promise<void> {
  const resultKey = `${STORAGE_KEYS.RESULT_PREFIX}${result.id}`
  await chrome.storage.local.set({ [resultKey]: result })

  const index = await getHistoryIndex()
  index.unshift({
    id: result.id,
    url: result.url,
    title: result.title,
    timestamp: result.timestamp,
    overallScore: result.overallScore,
  })

  while (index.length > MAX_HISTORY_ITEMS) {
    const removed = index.pop()!
    await chrome.storage.local.remove(`${STORAGE_KEYS.RESULT_PREFIX}${removed.id}`)
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY_INDEX]: index })
}

export async function getHistoryIndex(): Promise<HistoryIndexItem[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY_INDEX)
  return (result[STORAGE_KEYS.HISTORY_INDEX] as HistoryIndexItem[] | undefined) ?? []
}

export async function getResult(id: string): Promise<AnalysisResult | null> {
  const key = `${STORAGE_KEYS.RESULT_PREFIX}${id}`
  const result = await chrome.storage.local.get(key)
  return (result[key] as AnalysisResult | undefined) ?? null
}

export async function deleteResult(id: string): Promise<void> {
  const resultKey = `${STORAGE_KEYS.RESULT_PREFIX}${id}`
  await chrome.storage.local.remove(resultKey)

  const index = await getHistoryIndex()
  const filtered = index.filter((item) => item.id !== id)
  await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY_INDEX]: filtered })
}

export async function getResultsForExport(id: string): Promise<{ result: AnalysisResult | null; format: 'json' | 'text' }> {
  const result = await getResult(id)
  return { result, format: 'json' }
}
