import type { LLMProvider } from './interface'
import type { AnalysisResult, LLMProviderConfig, StatementResult, FactLabel } from '../../core/types'

function buildPrompt(text: string): string {
  return `당신은 웹 페이지의 사실 여부를 검증하는 팩트체크 AI입니다.
주어진 텍스트를 분석하여 각 문장(또는 논리적 단위)의 사실 여부를 판정하세요.

다음 웹 페이지의 내용을 분석해주세요.

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
- 0.8-1.0: 명확히 사실
- 0.6-0.8: 대체로 사실
- 0.4-0.6: 확인 불가
- 0.2-0.4: 대체로 허위
- 0.0-0.2: 명확히 허위
- opinion: 의견/주장

JSON 배열만 반환하세요. 추가 설명 없이 순수 JSON만 출력하세요.`
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

export const geminiProvider: LLMProvider = {
  id: 'gemini',
  name: 'Gemini',
  defaultModel: 'gemini-flash-latest',

  async analyze(text: string, config: LLMProviderConfig): Promise<AnalysisResult> {
    const baseUrl = config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'
    const url = `${baseUrl}/models/${config.model}:generateContent`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(text) }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
        },
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Gemini API error ${response.status}: ${body}`)
    }

    const data = await response.json()
    const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
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
