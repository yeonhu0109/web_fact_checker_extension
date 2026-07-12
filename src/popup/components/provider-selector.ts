import type { ProviderDescriptor, AppSettings } from '../../core/types'

export function createProviderSelector(
  providers: ProviderDescriptor[],
  currentSettings: AppSettings,
  onChange: (settings: AppSettings) => void,
): HTMLElement {
  const container = document.createElement('div')

  // Provider select
  const providerLabel = document.createElement('label')
  providerLabel.textContent = 'LLM Provider'
  const providerSelect = document.createElement('select')
  providers.forEach((p) => {
    const opt = document.createElement('option')
    opt.value = p.id
    opt.textContent = p.name
    if (p.id === currentSettings.provider.id) opt.selected = true
    providerSelect.appendChild(opt)
  })
  providerLabel.appendChild(providerSelect)
  container.appendChild(providerLabel)

  // Model select
  const modelLabel = document.createElement('label')
  modelLabel.textContent = '모델'
  const modelSelect = document.createElement('select')
  const currentProvider = providers.find((p) => p.id === currentSettings.provider.id)
  ;(currentProvider?.models ?? []).forEach((m) => {
    const opt = document.createElement('option')
    opt.value = m
    opt.textContent = m
    if (m === currentSettings.provider.model) opt.selected = true
    modelSelect.appendChild(opt)
  })
  modelLabel.appendChild(modelSelect)
  container.appendChild(modelLabel)

  // API Key input
  const keyLabel = document.createElement('label')
  keyLabel.textContent = 'API Key'
  const keyInput = document.createElement('input')
  keyInput.type = 'password'
  keyInput.className = 'api-key-input'
  keyInput.value = currentSettings.provider.apiKey
  keyInput.placeholder = 'API 키를 입력하세요'
  keyLabel.appendChild(keyInput)
  container.appendChild(keyLabel)

  // Update models when provider changes
  providerSelect.addEventListener('change', () => {
    const selected = providers.find((p) => p.id === providerSelect.value)
    modelSelect.innerHTML = ''
    ;(selected?.models ?? []).forEach((m) => {
      const opt = document.createElement('option')
      opt.value = m
      opt.textContent = m
      if (m === selected?.defaultModel) opt.selected = true
      modelSelect.appendChild(opt)
    })
    onChange({
      provider: {
        id: providerSelect.value,
        name: selected?.name ?? '',
        apiKey: keyInput.value,
        model: modelSelect.value,
      },
    })
  })

  modelSelect.addEventListener('change', () => {
    const selected = providers.find((p) => p.id === providerSelect.value)
    onChange({
      provider: {
        id: providerSelect.value,
        name: selected?.name ?? '',
        apiKey: keyInput.value,
        model: modelSelect.value,
      },
    })
  })

  keyInput.addEventListener('input', () => {
    const selected = providers.find((p) => p.id === providerSelect.value)
    onChange({
      provider: {
        id: providerSelect.value,
        name: selected?.name ?? '',
        apiKey: keyInput.value,
        model: modelSelect.value,
      },
    })
  })

  return container
}
