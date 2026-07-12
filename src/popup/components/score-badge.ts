export function createScoreBadge(score: number | null): HTMLElement {
  const badge = document.createElement('span')
  badge.style.display = 'inline-block'
  badge.style.padding = '4px 12px'
  badge.style.borderRadius = '12px'
  badge.style.fontWeight = 'bold'
  badge.style.fontSize = '18px'

  if (score === null) {
    badge.textContent = 'N/A'
    badge.style.backgroundColor = '#e0e0e0'
    badge.style.color = '#666'
  } else if (score >= 0.8) {
    badge.textContent = `${(score * 100).toFixed(0)}%`
    badge.style.backgroundColor = '#c8e6c9'
    badge.style.color = '#2e7d32'
  } else if (score >= 0.6) {
    badge.textContent = `${(score * 100).toFixed(0)}%`
    badge.style.backgroundColor = '#dcedc8'
    badge.style.color = '#558b2f'
  } else if (score >= 0.4) {
    badge.textContent = `${(score * 100).toFixed(0)}%`
    badge.style.backgroundColor = '#fff9c4'
    badge.style.color = '#f57f17'
  } else if (score >= 0.2) {
    badge.textContent = `${(score * 100).toFixed(0)}%`
    badge.style.backgroundColor = '#ffe0b2'
    badge.style.color = '#e65100'
  } else {
    badge.textContent = `${(score * 100).toFixed(0)}%`
    badge.style.backgroundColor = '#ffcdd2'
    badge.style.color = '#c62828'
  }

  return badge
}
