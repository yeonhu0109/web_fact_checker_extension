# 분석 파이프라인 (Analysis Pipeline)

## 전체 흐름

```
[1] 트리거                              사용자가 팝업에서 "분석" 버튼 클릭
      │
      ▼
[2] 본문 추출 (Content Script)          Readability.parse() 실행
      │                                   → 순수 텍스트 + 제목 추출
      ▼
[3] 텍스트 전처리                        토큰 수 계산, 청크 분할 (필요시)
      │
      ▼
[4] LLM API 호출 (Background)           선택된 Provider로 API 요청
      │                                   → 커스텀 프롬프트 + 추출된 텍스트
      ▼
[5] 응답 파싱                            JSON 파싱, StatementResult[] 변환
      │
      ▼
[6] 점수 집계                            전체 신뢰도 점수(overallScore) 산출
      │
      ▼
[7] 결과 저장                            chrome.storage.local에 저장
      │
      ▼
[8] 결과 전달                            Popup에 결과 표시, Content에 하이라이트
```

## 상세 단계

### 1. 트리거 (Popup → Background)
- Popup: `chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE', tabId })`
- Background: 현재 활성 탭의 `tabId` 확인

### 2. 본문 추출 (Background → Content)
- Background: `chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_CONTENT' })`
- Content Script:
  1. `document.cloneNode(true)`로 DOM 복제 (원본 페이지 영향 최소화)
  2. `new Readability(clonedDoc).parse()` 실행
  3. 반환값에서 `textContent`(순수 텍스트)와 `title` 추출
  4. 추출 실패 시 fallback: `document.body.innerText` 사용
  5. 결과를 Background로 반환

### 3. 텍스트 전처리 (Background)
- 추출된 텍스트의 토큰 수 계산
- Provider별 컨텍스트 윈도우 제한 확인:
  - GPT-4: ~8K / ~32K 토큰
  - Claude 3: ~200K 토큰
  - Gemini Pro: ~32K 토큰
- 제한 초과 시 청크 분할:
  - 문장 경계에서 분할 (마침표, 느낌표, 물음표)
  - 각 청크에 컨텍스트 유지를 위해 이전 청크의 마지막 1-2문장 포함 (오버랩)
  - 각 청크별 개별 분석 후 결과 병합

### 4. LLM API 호출 (Background → Provider)
- 선택된 `LLMProvider`의 `analyze()` 메서드 호출
- 커스텀 프롬프트 전송 (프롬프트 템플릿에 추출된 텍스트 삽입)
- API 호출 파라미터:
  - `model`: Provider 설정에서 지정
  - `temperature`: 0.3 (일관된 사실 판정을 위해 낮은 값)
  - `max_tokens`: Provider별 적절한 값

### 5. 응답 파싱 (Background)
- LLM 응답에서 JSON 배열 추출 (정규식 또는 JSON 파서)
- 각 항목 검증:
  - `text` 필드 존재 확인
  - `score` 0.0~1.0 범위 확인
  - `label` 유효한 FactLabel인지 확인
- 파싱 실패 시 재시도 (최대 2회, temperature 0.0으로 고정)

### 6. 점수 집계 (Background)
- 전체 신뢰도 점수 산출: `overallScore = 모든 statement.score의 평균`
- `label`이 `opinion`인 문장은 점수 집계에서 제외
- 요약 생성: 가장 낮은 점수의 statement 기준으로 1-2문장 요약

### 7. 결과 저장 (Background)
- `AnalysisResult` 객체 생성 (`id = Date.now().toString(36) + url.hash`)
- `chrome.storage.local`에 저장:
  ```
  key: `result_${result.id}`
  value: JSON.stringify(result)
  ```
- 히스토리 인덱스 업데이트:
  ```
  key: 'history_index'
  value: [{ id, url, title, timestamp, overallScore }]
  ```
- 최대 히스토리 보관 개수: 50개 (초과 시 가장 오래된 항목부터 삭제)

### 8. 결과 전달 (Background → Popup + Content)
- Popup: `chrome.runtime.sendMessage({ type: 'ANALYSIS_COMPLETE', result })`
- Content: `chrome.tabs.sendMessage(tabId, { type: 'APPLY_HIGHLIGHTS', highlights })`
  - 각 `StatementResult` → `HighlightData` 변환
  - score 기준 색상 매핑:
    - 0.8~1.0: `true` / `mostly_true` → 초록 (#4caf50)
    - 0.5~0.8: `unverified` → 노랑 (#ffeb3b)
    - 0.0~0.5: `mostly_false` / `false` → 빨강 (#f44336)
    - `opinion`: 회색 (#9e9e9e)

## 재시도 정책

| 실패 유형 | 재시도 횟수 | 간격 | 비고 |
|----------|-----------|------|------|
| 네트워크 오류 | 2회 | 2초 | 일시적 네트워크 장애 |
| HTTP 429 (할당량) | 2회 | 5초 | Rate limit 초과 |
| HTTP 401 (인증) | 0회 | - | API 키 오류 → 설정 변경 유도 |
| HTTP 500 (서버) | 1회 | 3초 | Provider 서버 오류 |
| 응답 파싱 실패 | 2회 | 1초 | temperature 0.0으로 재시도 |

모든 재시도 실패 시 Popup에 구체적 에러 메시지 전달.

## 에지 케이스

| 상황 | 처리 |
|------|------|
| 분석할 텍스트가 없음 | "페이지에서 분석할 내용을 찾을 수 없습니다" |
| 텍스트가 너무 짧음 (50자 미만) | "분석할 내용이 충분하지 않습니다" |
| 모든 문장이 opinion | "본문이 주로 의견/주장으로 구성되어 있습니다" |
| 청크 분석 결과 충돌 | 동일 문장이 여러 청크에 포함된 경우, 첫 번째 결과 사용 |
| Service Worker 종료 후 재시작 | chrome.storage.local에서 기존 결과 로드 가능 |
| LLM 응답이 비정상적 형식 | 파싱 실패로 간주하고 재시도 |
