import type { AnalysisResult } from '../../core/types'
import { createScoreBadge } from '../components/score-badge'
import { createResultCard } from '../components/result-card'

export async function renderHistoryView(container: HTMLElement): Promise<void> {
  container.innerHTML = '<div class="loading">내역 로딩 중...</div>'

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' })
    if (response.type !== 'HISTORY_DATA') {
      container.innerHTML = '<p>내역을 불러올 수 없습니다.</p>'
      return
    }

    const items = response.items
    if (items.length === 0) {
      container.innerHTML = '<p>분석 내역이 없습니다.</p>'
      return
    }

    container.innerHTML = ''

    items.forEach((item: AnalysisResult) => {
      const card = document.createElement('div')
      card.className = 'history-item'

      const header = document.createElement('div')
      header.style.display = 'flex'
      header.style.alignItems = 'center'
      header.style.gap = '8px'

      const badge = createScoreBadge(item.overallScore)
      badge.style.fontSize = '14px'
      badge.style.padding = '2px 8px'
      header.appendChild(badge)

      const info = document.createElement('div')
      info.style.flex = '1'
      const title = document.createElement('div')
      title.textContent = item.title.length > 50 ? item.title.slice(0, 50) + '...' : item.title
      title.style.fontWeight = 'bold'
      const date = document.createElement('small')
      date.textContent = new Date(item.timestamp).toLocaleString('ko-KR')
      info.appendChild(title)
      info.appendChild(date)
      header.appendChild(info)

      card.appendChild(header)

      // Detail view toggle
      const detail = document.createElement('div')
      detail.hidden = true
      detail.style.marginTop = '8px'
      detail.style.padding = '8px'
      detail.style.borderTop = '1px solid var(--pico-muted-border-color)'

      item.statements.forEach((stmt) => {
        detail.appendChild(createResultCard(stmt))
      })

      // Export buttons
      const btnGroup = document.createElement('div')
      btnGroup.style.marginTop = '8px'
      btnGroup.style.display = 'flex'
      btnGroup.style.gap = '4px'

      const jsonBtn = document.createElement('button')
      jsonBtn.className = 'secondary'
      jsonBtn.textContent = 'JSON 내보내기'
      jsonBtn.style.fontSize = '12px'
      jsonBtn.style.padding = '4px 8px'
      jsonBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        handleExport(item.id, 'json')
      })

      const textBtn = document.createElement('button')
      textBtn.className = 'secondary'
      textBtn.textContent = '텍스트 내보내기'
      textBtn.style.fontSize = '12px'
      textBtn.style.padding = '4px 8px'
      textBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        handleExport(item.id, 'text')
      })

      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'contrast'
      deleteBtn.textContent = '삭제'
      deleteBtn.style.fontSize = '12px'
      deleteBtn.style.padding = '4px 8px'
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        handleDelete(item.id)
      })

      btnGroup.appendChild(jsonBtn)
      btnGroup.appendChild(textBtn)
      btnGroup.appendChild(deleteBtn)
      detail.appendChild(btnGroup)

      card.appendChild(detail)

      card.addEventListener('click', () => {
        detail.hidden = !detail.hidden
      })

      container.appendChild(card)
    })
  } catch {
    container.innerHTML = '<p>내역을 불러올 수 없습니다.</p>'
  }
}

async function handleExport(resultId: string, format: 'json' | 'text'): Promise<void> {
  const response = await chrome.runtime.sendMessage({ type: 'EXPORT_RESULT', resultId, format })
  if (response.type !== 'EXPORT_DATA' || !response.content) return

  const blob = new Blob([response.content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `factcheck-${resultId.slice(0, 8)}.${format}`
  a.click()
  URL.revokeObjectURL(url)
}

async function handleDelete(resultId: string): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'DELETE_RESULT', resultId })
  const container = document.getElementById('view-history')!
  await renderHistoryView(container)
}
