import type { StatementResult } from '../../core/types'

export function createResultCard(stmt: StatementResult): HTMLElement {
  const card = document.createElement('div')
  card.className = 'result-card'

  const header = document.createElement('div')
  header.style.display = 'flex'
  header.style.alignItems = 'center'
  header.style.gap = '8px'
  header.style.marginBottom = '4px'

  const badge = document.createElement('span')
  badge.className = `badge-${stmt.label}`
  badge.textContent = `${stmt.label} (${(stmt.score * 100).toFixed(0)}%)`
  badge.style.fontWeight = 'bold'
  badge.style.fontSize = '12px'

  header.appendChild(badge)
  card.appendChild(header)

  const text = document.createElement('p')
  text.className = 'statement-text'
  text.textContent = stmt.text
  card.appendChild(text)

  const explanation = document.createElement('small')
  explanation.textContent = stmt.explanation
  explanation.style.color = 'var(--pico-muted-color)'
  card.appendChild(explanation)

  return card
}
