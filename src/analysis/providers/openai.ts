import type { LLMProvider } from './interface'
import type { AnalysisResult, LLMProviderConfig, StatementResult, FactLabel } from '../../core/types'

const SYSTEM_PROMPT = `당신은 웹 페이지의 사실 여부를 검증하는 팩트체크 AI입니다.
주어진 텍스트를 분석하여 각 문장(또는 논리적 단위)의 사실 여부를 판정하세요.
JSON 배열 형식으로만 응답하세요. 추가 설명이나 마크다운 없이 순수 JSON만 반환하세요.`

function buildUserPrompt(text: string): string {
  return `다음 웹 페이지의 내용을 분석해주세요.

--- 분석할 텍스트 시작 ---
${text}
--- 분석할 텍스트 끝 ---

각 문장(또는 논리적 단위)에 대해 다음 JSON 배열을 반환하세요:
[
  {
    "text": "분석할 문장/단위",
    "score": 0.0에서 1.0 사이의 점수,
    "label": "true | mostly_true | unverified | mostly_false | false | opinion",
    "explanation": "한국어로 1-2문장 근거 설명"
  }
]

점수 기준:
- 0.8-1.0: 명확히 사실, 검증 가능한 출처 존재
- 0.6-0.8: 대체로 사실, 일부 맥락 부족
- 0.4-0.6: 확인 불가, 검증 어려움
- 0.2-0.4: 대체로 허위, 오해의 소지
- 0.0-0.2: 명확히 허위
- opinion: 사실 판정 대상이 아닌 의견/주장`
}

const VALID_LABELS: FactLabel[] = ['true', 'mostly_true', 'unverified', 'mostly_false', 'false', 'opinion']

function parseResponse(content: string): StatementResult[] {
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const parsed = JSON.parse(cleaned)
  if (!Array.isArray(parsed)) throw new Error('Response is not an array')

  return parsed.map((item: Record<string, unknown>) => {
    const label = String(item.label ?? 'unverified') as FactLabel
    return {
      text: String(item.text ?? ''),
      score: Math.max(0, Math.min(1, Number(item.score ?? 0.5))),
      label: VALID_LABELS.includes(label) ? label : 'unverified',
      explanation: String(item.explanation ?? ''),
    }
  }) as StatementResult[]
}

function computeOverall(statements: StatementResult[]): number | null {
  const nonOpinions = statements.filter((s) => s.label !== 'opinion')
  if (nonOpinions.length === 0) return null
  return nonOpinions.reduce((sum, s) => sum + s.score, 0) / nonOpinions.length
}

export const openaiProvider: LLMProvider = {
  id: 'openai',
  name: 'OpenAI',
  defaultModel: 'gpt-4o-mini',

  async analyze(text: string, config: LLMProviderConfig): Promise<AnalysisResult> {
    const response = await fetch(config.baseUrl ?? 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(text) },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${body}`)
    }

    const data = await response.json()
    const content: string = data.choices?.[0]?.message?.content ?? ''
    const statements = parseResponse(content)
    const overallScore = computeOverall(statements)

    return {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      url: '',
      title: '',
      overallScore,
      statements,
      summary: overallScore !== null
        ? `전체 신뢰도: ${(overallScore * 100).toFixed(0)}% (${statements.length}개 문장 분석)`
        : '의견/주장 위주의 페이지입니다.',
    }
  },
}
