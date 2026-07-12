import type { AnalysisResult } from '../../core/types'
import { createScoreBadge } from '../components/score-badge'
import { createResultCard } from '../components/result-card'

export function renderAnalyzeView(container: HTMLElement): void {
  container.innerHTML = ''

  const analyzeBtn = document.createElement('button')
  analyzeBtn.textContent = '🔍 분석 시작'
  analyzeBtn.className = 'primary'
  container.appendChild(analyzeBtn)

  const resultArea = document.createElement('div')
  resultArea.id = 'analyze-result'
  container.appendChild(resultArea)

  analyzeBtn.addEventListener('click', async () => {
    analyzeBtn.disabled = true
    analyzeBtn.textContent = '분석 중...'
    resultArea.innerHTML = '<div class="loading">LLM API로 분석 중입니다...</div>'

    try {
      const response = await chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE' })
      if (response.type === 'ANALYSIS_ERROR') {
        resultArea.innerHTML = `<article class="error">❌ ${response.error}</article>`
        return
      }
      if (response.type === 'ANALYSIS_COMPLETE') {
        renderResult(resultArea, response.result)
      }
    } catch (err) {
      resultArea.innerHTML = `<article class="error">❌ ${err instanceof Error ? err.message : String(err)}</article>`
    } finally {
      analyzeBtn.disabled = false
      analyzeBtn.textContent = '🔍 분석 시작'
    }
  })
}

function renderResult(container: HTMLElement, result: AnalysisResult): void {
  container.innerHTML = ''

  const header = document.createElement('div')
  header.style.display = 'flex'
  header.style.alignItems = 'center'
  header.style.gap = '12px'
  header.style.marginBottom = '16px'

  const badge = createScoreBadge(result.overallScore)
  header.appendChild(badge)

  const summary = document.createElement('div')
  summary.innerHTML = `<strong>${result.summary}</strong><br><small>${result.statements.length}개 문장 분석</small>`
  header.appendChild(summary)

  container.appendChild(header)

  result.statements.forEach((stmt) => {
    container.appendChild(createResultCard(stmt))
  })
}
