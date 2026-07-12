import type { AppSettings, ProviderDescriptor } from '../../core/types'
import { createProviderSelector } from '../components/provider-selector'

let currentSettings: AppSettings | null = null
let providerDescriptors: ProviderDescriptor[] = []
let selectorContainer: HTMLElement | null = null

export async function renderSettingsView(container: HTMLElement): Promise<void> {
  container.innerHTML = '<div class="loading">설정 로딩 중...</div>'

  try {
    const [settingsRes, providersRes] = await Promise.all([
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
      chrome.runtime.sendMessage({ type: 'GET_PROVIDERS' }),
    ])

    if (settingsRes.type !== 'SETTINGS_DATA') {
      container.innerHTML = '<p>설정을 불러올 수 없습니다.</p>'
      return
    }
    if (providersRes.type !== 'PROVIDERS_LIST') {
      container.innerHTML = '<p>Provider 목록을 불러올 수 없습니다.</p>'
      return
    }

    currentSettings = settingsRes.settings
    providerDescriptors = providersRes.providers

    container.innerHTML = ''
    const heading = document.createElement('h3')
    heading.textContent = 'API 설정'
    container.appendChild(heading)

    selectorContainer = document.createElement('div')
    container.appendChild(selectorContainer)
    renderSelector()

    const saveBtn = document.createElement('button')
    saveBtn.className = 'primary'
    saveBtn.textContent = '저장'
    saveBtn.style.marginTop = '16px'
    container.appendChild(saveBtn)

    const status = document.createElement('p')
    status.id = 'settings-status'
    status.style.marginTop = '8px'
    container.appendChild(status)

    saveBtn.addEventListener('click', async () => {
      if (!currentSettings) return
      await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: currentSettings })
      status.textContent = '✅ 설정이 저장되었습니다.'
      status.style.color = 'var(--pico-ins-color)'
    })
  } catch {
    container.innerHTML = '<p>설정을 불러올 수 없습니다.</p>'
  }
}

function renderSelector(): void {
  if (!selectorContainer || !currentSettings) return
  selectorContainer.innerHTML = ''
  const el = createProviderSelector(providerDescriptors, currentSettings, (settings) => {
    currentSettings = settings
  })
  selectorContainer.appendChild(el)
}
