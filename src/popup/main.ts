import { renderAnalyzeView } from './views/analyze-view'
import { renderHistoryView } from './views/history-view'
import { renderSettingsView } from './views/settings-view'

type ViewName = 'analyze' | 'history' | 'settings'

const views: Record<ViewName, HTMLElement> = {
  analyze: document.getElementById('view-analyze')!,
  history: document.getElementById('view-history')!,
  settings: document.getElementById('view-settings')!,
}

const navLinks = document.querySelectorAll<HTMLAnchorElement>('nav a[data-view]')

function showView(name: ViewName): void {
  for (const [key, el] of Object.entries(views)) {
    el.hidden = key !== name
  }
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.view === name)
  })

  // Render the view content
  switch (name) {
    case 'analyze':
      renderAnalyzeView(views.analyze)
      break
    case 'history':
      renderHistoryView(views.history)
      break
    case 'settings':
      renderSettingsView(views.settings)
      break
  }
}

navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault()
    showView(link.dataset.view as ViewName)
  })
})

document.addEventListener('DOMContentLoaded', () => {
  showView('analyze')
})
