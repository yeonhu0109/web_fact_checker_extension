# 도메인 모델 (Domain Model)

## 유비쿼터스 언어 (Ubiquitous Language)

| 용어 | 정의 |
|------|------|
| **팩트체크 (Fact Check)** | 웹 페이지의 주장/문장이 사실인지 검증하는 행위 |
| **분석 (Analysis)** | LLM API를 통해 텍스트의 사실 여부를 평가하는 과정 |
| **신뢰도 점수 (Credibility Score)** | 0.0~1.0 범위의 실수 값으로, 진실성에 대한 확신 정도 |
| **판정 레이블 (Fact Label)** | `true` / `mostly_true` / `unverified` / `mostly_false` / `false` / `opinion` 중 하나 |
| **문장 단위 분석 (Statement-level Analysis)** | 본문을 개별 문장으로 분할하여 각각 판정 |
| **LLM Provider** | 분석을 수행하는 외부 AI 모델 서비스 (OpenAI, Claude, Gemini 등) |
| **본문 추출 (Content Extraction)** | 웹 페이지의 HTML에서 주요 텍스트 콘텐츠만 추출 |
| **하이라이트 (Highlight)** | 분석 결과에 따라 페이지 내 문장에 색상을 입히는 시각화 |
| **분석 내역 (Analysis History)** | chrome.storage.local에 저장된 과거 분석 결과 |

## 엔티티 (Entities)

### `AnalysisResult`
- **식별자**: `id` (timestamp + URL hash 기반 UUID)
- **속성**: `timestamp`, `url`, `title`, `overallScore`, `statements[]`, `summary`
- **수명**: chrome.storage.local에 영구 저장, 사용자가 삭제 가능
- **불변**: 생성 후 변경되지 않음

### `AppSettings`
- **식별자**: 단일 인스턴스 (싱글톤)
- **속성**: `provider` (선택된 LLM Provider 설정), `analysisTarget`
- **수명**: chrome.storage.local에 영구 저장
- **가변**: 사용자가 언제든 변경 가능

## 값 객체 (Value Objects)

### `StatementResult`
- 속성: `text`, `score`, `label`, `explanation`, `citations?`
- 불변, 식별자 없음
- `AnalysisResult`에 귀속됨

### `LLMProviderConfig`
- 속성: `id`, `name`, `apiKey`, `model`, `baseUrl?`
- 설정값으로만 사용, 식별자 없음

### `HighlightData`
- 속성: `text`, `score`, `label`
- Content Script에 전달되는 일시적 데이터

## 도메인 이벤트 (Domain Events)

| 이벤트 | 발생 시점 | 발신자 | 수신자 |
|--------|----------|--------|--------|
| `AnalysisRequested` | 사용자가 분석 버튼 클릭 | Popup | Background |
| `ContentExtracted` | Readability가 본문 추출 완료 | Content | Background |
| `AnalysisCompleted` | LLM 응답 수신 및 파싱 완료 | Background | Popup, Content |
| `AnalysisFailed` | LLM 호출 실패 | Background | Popup |
| `HighlightsApplied` | 페이지 내 하이라이트 완료 | Content | Background |
| `SettingsChanged` | 사용자가 설정 저장 | Popup | Background |
| `HistoryDeleted` | 사용자가 분석 내역 삭제 | Popup | Background |
| `ExportRequested` | 사용자가 내보내기 실행 | Popup | Background |
