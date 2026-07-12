import type { BackgroundToContent } from './core/messages'
import type { HighlightData } from './core/types'

console.log('[Content] Content script loaded')

chrome.runtime.onMessage.addListener(
  (message: BackgroundToContent, _sender, sendResponse) => {
    switch (message.type) {
      case 'APPLY_HIGHLIGHTS':
        applyHighlights(message.highlights)
        sendResponse({ success: true })
        break
      case 'CLEAR_HIGHLIGHTS':
        clearHighlights()
        sendResponse({ success: true })
        break
    }
    return true
  },
)

function applyHighlights(highlights: HighlightData[]): void {
  clearHighlights()

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
  )

  const textNodes: Text[] = []
  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node)
  }

  for (const hl of highlights) {
    for (const textNode of textNodes) {
      const idx = textNode.textContent?.indexOf(hl.text)
      if (idx === undefined || idx === -1) continue

      const range = document.createRange()
      range.setStart(textNode, idx)
      range.setEnd(textNode, idx + hl.text.length)

      const color = scoreToColor(hl.score, hl.label)
      const mark = document.createElement('mark')
      mark.style.backgroundColor = color
      mark.style.padding = '0 2px'
      mark.style.borderRadius = '2px'
      mark.dataset.score = String(hl.score)
      mark.dataset.label = hl.label
      mark.title = `${hl.label} (${hl.score.toFixed(2)})`
      range.surroundContents(mark)
      break
    }
  }
}

function clearHighlights(): void {
  document.querySelectorAll('mark[data-score]').forEach((el) => {
    const parent = el.parentNode
    if (!parent) return
    parent.replaceChild(document.createTextNode(el.textContent ?? ''), el)
    parent.normalize()
  })
}

function scoreToColor(score: number, label: string): string {
  if (label === 'opinion') return '#e0e0e0'
  if (score >= 0.8) return '#c8e6c9'
  if (score >= 0.6) return '#dcedc8'
  if (score >= 0.4) return '#fff9c4'
  if (score >= 0.2) return '#ffe0b2'
  return '#ffcdd2'
}
